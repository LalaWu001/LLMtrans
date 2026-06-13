import os
import time
import tkinter as tk
from tkinter import filedialog

from playwright.sync_api import (
    sync_playwright,
    TimeoutError as PlaywrightTimeoutError
)

def select_file(title, filetypes=None):
    """弹出文件选择窗口"""
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    file_path = filedialog.askopenfilename(
        title=title,
        filetypes=filetypes or [("所有文件", "*.*")]
    )
    root.destroy()
    return file_path
def wait_for_page(page):
    """等待页面基础内容加载完成"""

    try:
        page.wait_for_load_state(
            "domcontentloaded",
            timeout=30000
        )
        return True

    except Exception:
        return False


def main():
    # 第一次弹窗：选择 Playwright 保存的登录状态文件
    auth_path = select_file(
        title="请选择 cookies 登录状态文件",
        filetypes=[
            ("JSON 文件", "*.json"),
            ("所有文件", "*.*")
        ]
    )
    if not auth_path:
        print("未选择 cookies 文件，程序退出。")
        return

    if not os.path.exists(auth_path):
        print(f"cookies 文件不存在：{auth_path}")
        return

    # 第二次弹窗：选择需要上传到豆包云盘的文件
    upload_path = select_file(
        title="请选择需要上传到豆包云盘的文件",
        filetypes=[ ("所有文件", "*.*")]
    )

    if not upload_path:
        print("未选择上传文件，程序退出。")
        return

    if not os.path.exists(upload_path):
        print(f"上传文件不存在：{upload_path}")
        return

    print(f"登录状态文件：{auth_path}")
    print(f"准备上传文件：{upload_path}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            # 定位没有问题后，可以改成 True
            headless=True,

            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ],
            timeout=60000
        )
        context = browser.new_context(
            storage_state=auth_path,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/129.0.0.0 Safari/537.36"
            ),
            locale="zh-CN",
            timezone_id="Asia/Shanghai",
            java_script_enabled=True,
            bypass_csp=True,
            viewport={
                "width": 1440,
                "height": 900
            }
        )
        page = context.new_page()
        page.set_default_timeout(30000)
        try:
            print("正在打开豆包……")
            page.goto(
                "https://www.doubao.com/chat/",
                wait_until="domcontentloaded",
                timeout=60000
            )
            wait_for_page(page)
            # 1. 使用你第一次提供的定位进入云盘
            print("正在进入云盘……")
            page.get_by_role("link", name="云盘").click()
            page.wait_for_load_state("domcontentloaded",timeout=30000)
            time.sleep(2)
            page.reload()
            # 2. 使用你第一次提供的定位点击上传
            print("正在点击上传按钮……")
            page.get_by_role("button",name="上传" ).click()
            time.sleep(1)
            # 3. 先监听系统文件选择事件
            # 再使用你第一次提供的定位点击“上传文件”
            print("正在提交文件……")
            with page.expect_file_chooser(
                timeout=30000
            ) as file_chooser_info:
                page.get_by_test_id(
                    "ai_space_upload_file_popover_upload_file"
                ).get_by_text(
                    "上传文件"
                ).click()

            # 4. 将 tkinter 中手动选择的文件交给文件选择器
            file_chooser = file_chooser_info.value
            file_chooser.set_files(
                upload_path
            )
            print(f"文件已选择：{upload_path}")
            print("正在等待豆包处理上传任务……")
            time.sleep(10)
            print("上传操作已经提交，请查看豆包云盘页面。")
            # 更新 cookies 和登录状态
            context.storage_state(
                path=auth_path
            )
            input("按 Enter 关闭浏览器……")
        except PlaywrightTimeoutError as error:
            print(f"操作超时：{error}")
        except Exception as error:
            print(f"操作过程出错：{error}")

        finally:
            try:
                context.storage_state(
                    path=auth_path
                )
            except Exception:
                pass

            browser.close()


if __name__ == "__main__":
    main()
