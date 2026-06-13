import base64
import builtins
import json
import os
import runpy
import sys
import tkinter
from tkinter import filedialog


EVENT_PREFIX = "LLMTRANS_FILE_EVENT:"


def emit_event(payload):
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, ensure_ascii=False).encode("utf-8")
    ).decode("ascii").rstrip("=")
    print(f"{EVENT_PREFIX}{encoded}", flush=True)


class DummyRoot:
    def withdraw(self):
        pass

    def attributes(self, *_args):
        pass

    def destroy(self):
        pass


class OutputCapture:
    def __init__(self, stream):
        self.stream = stream
        self.parts = []

    def write(self, text):
        self.parts.append(text)
        return self.stream.write(text)

    def flush(self):
        return self.stream.flush()

    def text(self):
        return "".join(self.parts)


def read_sender_command():
    for line in sys.stdin:
        command = json.loads(line)
        if command.get("type") in ("send", "stop"):
            return command
    return {"type": "stop"}


def run_sender(script_path, cookie_path):
    selection_index = 0
    command = None
    original_tk = tkinter.Tk
    original_open = filedialog.askopenfilename
    original_input = builtins.input
    original_stdout = sys.stdout
    output = OutputCapture(original_stdout)

    def choose_file(**_kwargs):
        nonlocal selection_index, command
        selection_index += 1
        if selection_index == 1:
            return cookie_path
        emit_event({"type": "ready", "role": "file-sender"})
        command = read_sender_command()
        return command.get("filePath", "") if command.get("type") == "send" else ""

    tkinter.Tk = DummyRoot
    filedialog.askopenfilename = choose_file
    builtins.input = lambda _prompt="": ""
    sys.stdout = output
    try:
        runpy.run_path(script_path, run_name="__main__")
        sys.stdout = original_stdout
        if not command or command.get("type") == "stop":
            return True
        file_path = command["filePath"]
        transfer_id = command["transferId"]
        if "上传操作已经提交" in output.text():
            emit_event({
                "type": "sent",
                "transferId": transfer_id,
                "filePath": file_path,
                "fileName": os.path.basename(file_path),
            })
        else:
            emit_event({
                "type": "error",
                "transferId": transfer_id,
                "filePath": file_path,
                "fileName": os.path.basename(file_path),
                "message": "文件发送脚本未确认上传成功",
            })
    except Exception as error:
        sys.stdout = original_stdout
        if not command or command.get("type") == "stop":
            return True
        emit_event({
            "type": "error",
            "transferId": command.get("transferId"),
            "filePath": command.get("filePath", ""),
            "fileName": os.path.basename(command.get("filePath", "")),
            "message": str(error),
        })
    finally:
        tkinter.Tk = original_tk
        filedialog.askopenfilename = original_open
        builtins.input = original_input
        sys.stdout = original_stdout
    return False


def run_sender_loop(script_path, cookie_path):
    while not run_sender(script_path, cookie_path):
        pass


def run_receiver(script_path, cookie_path, save_directory):
    os.makedirs(save_directory, exist_ok=True)
    original_open = filedialog.askopenfilename
    original_directory = filedialog.askdirectory
    filedialog.askopenfilename = lambda **_kwargs: cookie_path
    filedialog.askdirectory = lambda **_kwargs: save_directory
    emit_event({
        "type": "ready",
        "role": "file-receiver",
        "saveDirectory": save_directory,
    })
    try:
        runpy.run_path(script_path, run_name="__main__")
    finally:
        filedialog.askopenfilename = original_open
        filedialog.askdirectory = original_directory


def main():
    if len(sys.argv) < 4:
        raise SystemExit("usage: adapter.py sender|receiver script cookie [save-directory]")
    role = sys.argv[1]
    script_path = os.path.abspath(sys.argv[2])
    cookie_path = os.path.abspath(sys.argv[3])
    if role == "sender":
        run_sender_loop(script_path, cookie_path)
    elif role == "receiver":
        if len(sys.argv) < 5:
            raise SystemExit("receiver requires save directory")
        run_receiver(script_path, cookie_path, os.path.abspath(sys.argv[4]))
    else:
        raise SystemExit(f"unknown role: {role}")


if __name__ == "__main__":
    main()
