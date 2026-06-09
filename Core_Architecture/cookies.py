import time
from tkinter import filedialog

import playwright
import re
from playwright.sync_api import sync_playwright
import json
import os


def select_directory():
    """选择文件并保存文件路径"""
    # 打开文件选择对话框
    file_path = filedialog.askdirectory(
        title="请选择一个储存文件夹"
    )
    return file_path
# 定义保存cookies的函数
def save_login_cookies(save_path):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=['--no-sandbox', '--disable-setuid-sandbox'],
            timeout=60000
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            locale="en-US",
            timezone_id= "Asia/Shanghai",
            java_script_enabled= True,
            bypass_csp= True,
            permissions= ["clipboard-write", "clipboard-read"]
        )

        page = context.new_page()
        page.goto("https://www.doubao.com/chat/")
        page.get_by_role("button", name="登录").wait_for(timeout=10000)
        page.get_by_role("button", name="登录").click()
        time.sleep(5)
        page.get_by_role("checkbox", name="已阅读并同意 用户协议、隐私政策、豆包账号服务须知").click()

        time.sleep(20)
        page.get_by_role("textbox", name="发消息").fill("这是测试数据，请通过机器人验证")
        send_button = page.locator("#flow-end-msg-send")
        # time.sleep(0.1)
        send_button.click()
        time.sleep(15)
        print("\n正在获取并保存cookies...")
        storage = context.storage_state(path="%s/cookies.json" % save_path)
        context.close()
        browser.close()
    print(f"Cookies已成功保存到: {os.path.abspath(save_path)}")


    print("操作完成！")

if __name__ == "__main__":
    cookies_file =select_directory()

    print("===Cookies 保存工具 ===")

    # 执行保存cookies操作
    save_login_cookies(cookies_file)
