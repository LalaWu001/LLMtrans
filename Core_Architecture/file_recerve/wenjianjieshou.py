import os
import time
from tkinter import filedialog
from playwright.sync_api import sync_playwright, TimeoutError


def main():
    auth_path = filedialog.askopenfilename(
        title="请选择 cookies 文件",
        filetypes=[("JSON 文件", "*.json")]
    )

    if not auth_path:
        print("未选择 cookies 文件")
        return

    save_dir = filedialog.askdirectory(
        title="请选择下载保存文件夹"
    )

    if not save_dir:
        print("未选择保存文件夹")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True
        )

        context = browser.new_context(
            storage_state=auth_path,
            accept_downloads=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/129.0.0.0 Safari/537.36"
            ),
            locale="zh-CN",
            timezone_id="Asia/Shanghai",
            bypass_csp=True
        )

        page = context.new_page()

        try:
            page.goto(
                "https://www.doubao.com/chat/",
                wait_until="domcontentloaded",
                timeout=60000
            )

            # 进入云盘
            page.get_by_role(
                "link",
                name="云盘"
            ).click()

            page.wait_for_timeout(2000)

            file_number = 1

            while True:
                current_filename = f"text{file_number}.txt"

                print(f"正在检测：{current_filename}")

                try:
                    # 精确匹配文件名
                    # 存在多个同名文件时，只定位最靠前的一个
                    file_element = page.get_by_text(
                        current_filename,
                        exact=True
                    ).first

                    file_element.wait_for(
                        state="visible",
                        timeout=3000
                    )

                    print(f"检测到文件：{current_filename}")

                    # 找到文件所在的整行
                    file_row = file_element.locator(
                        "xpath=ancestor::*[contains(@class, "
                        "'file-row-wrapper')][1]"
                    )

                    # 点击该文件行右侧区域
                    file_row.locator(
                        ".right-column-VMR1jA.flex"
                    ).click()

                    # 下载文件
                    with page.expect_download(
                        timeout=60000
                    ) as download_info:

                        page.get_by_text(
                            "下载",
                            exact=True
                        ).click()

                    download = download_info.value

                    save_path = os.path.join(
                        save_dir,
                        download.suggested_filename
                    )

                    download.save_as(save_path)

                    print(f"下载成功：{save_path}")

                    # 下载成功后检测下一个文件
                    file_number += 1

                    context.storage_state(
                        path=auth_path
                    )

                    page.reload(
                        wait_until="domcontentloaded",
                        timeout=60000
                    )

                    page.wait_for_timeout(1000)

                except TimeoutError:
                    print(
                        f"未检测到 {current_filename}，"
                        "3 秒后重新检测"
                    )

                    time.sleep(3)

                    page.reload(
                        wait_until="domcontentloaded",
                        timeout=60000
                    )

                except Exception as e:
                    print(f"接收文件失败：{e}")

                    time.sleep(3)

                    page.reload(
                        wait_until="domcontentloaded",
                        timeout=60000
                    )

        except KeyboardInterrupt:
            print("程序已停止")

        except Exception as e:
            print(f"程序运行失败：{e}")


if __name__ == "__main__":
    main()
