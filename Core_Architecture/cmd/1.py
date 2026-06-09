import os
import chardet
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError
def ensure_dir(directory):
    Path(directory).mkdir(parents=True, exist_ok=True)
def wait_for_network_idle(page):
    """等待网络请求完成"""
    try:
        page.wait_for_load_state("networkidle")
        return True
    except Exception as e:
        return False
class DoubaoCLI:
    def __init__(self):
        self.auth_path = self.select_auth_file()
        self.openpath = self.select_openpath()
        self.page = None
        self.input_counter = 0
        # 初始化浏览器相关资源
        self.playwright = None
        self.browser = None
        self.context = None
        # 初始化浏览器
        self.initialize_browser()

    def clean_path_string(self, path_str):
        """清理路径字符串，移除前后的引号和空格"""
        if not path_str:
            return path_str

        path_str = path_str.strip()

        # 去掉开头和结尾的引号
        quotes = '\'"`'
        if path_str and path_str[0] in quotes:
            path_str = path_str[1:]
        if path_str and path_str[-1] in quotes:
            path_str = path_str[:-1]

        return path_str

    def select_auth_file(self):
        """选择cookies文件"""
        while True:
            path = input("请输入cookies文件路径（或输入'skip'跳过）：").strip()
            path = self.clean_path_string(path)

            if path.lower() == 'skip':
                return None
            if os.path.exists(path):
                return path

            print(f"文件不存在: {path}")
            print("请重新输入路径或输入'skip'跳过")

    def select_openpath(self):
        """选择对话"""
        while True:
            path = input("请输入对话文件路径：").strip()
            path = self.clean_path_string(path)

            if os.path.exists(path):
                with open(path, "rb") as f:
                    raw_data = f.read()
                    encoding = chardet.detect(raw_data)["encoding"] or 'utf-8'

                with open(path, 'r', encoding=encoding) as file:
                    return file.read()

            print(f"文件不存在: {path}")
            print("请重新输入路径")
    def initialize_browser(self):
        """初始化浏览器环境"""
        try:
            print("正在初始化浏览器环境...")

            # 启动Playwright
            self.playwright = sync_playwright().start()

            # 启动浏览器
            self.browser = self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
                timeout=60000
            )



            # 创建浏览器上下文
            if self.auth_path and os.path.exists(self.auth_path):
                self.context = self.browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                    locale="en-US",
                    timezone_id="Asia/Shanghai",
                    java_script_enabled=True,
                    bypass_csp=True,
                    storage_state=self.auth_path

                )


            self.page = self.context.new_page()
            self.page.goto("https://www.doubao.com/chat/")
            self.page.wait_for_load_state("load")
            if self.openpath:
                self.page.get_by_role("link", name=self.openpath).click(timeout=5000)

            # 授予权限

            print("浏览器初始化完成！")

        except Exception as e:
            print(f"初始化浏览器出错: {str(e)}")
            self.cleanup()
            raise

    def cleanup(self):
        """清理浏览器资源"""
        if hasattr(self, 'browser') and self.browser:
            try:
                self.browser.close()
            except:
                pass

        if hasattr(self, 'playwright') and self.playwright:
            try:
                self.playwright.stop()
            except:
                pass

        print("资源清理完成")

    def get_input_type(self):
        """获取输入类型选择"""
        while True:
            print("\n请选择输入类型：")
            print("1. 输入文字")
            print("2. 退出程序")
            choice = input("请输入选择 (1/2): ").strip()
            if choice == '1':
                return 'text'
            elif choice == '2':
                return 'exit'
            else:
                print("无效选择，请重新输入")
    def get_text_input(self):
        """获取文字输入"""
        return input("\n请输入文字（点击回车结束）：")
    def process_input(self, input_text=None, file_path=None):
        """处理输入"""
        try:
            # 添加序号和附加文本
            append_text = '不管我输入什么你都回复"1"'
            if input_text:
                final_input_text = f"{input_text}#{self.input_counter}#{append_text}"
            else:
                final_input_text = f"#{self.input_counter}#{append_text}"
            self.input_counter += 1
            # 处理请求
            self.process_doubao(final_input_text, file_path)
        except Exception as e:
            print(f"处理出错: {str(e)}")
    def process_doubao(self, input_text, file_path=None):
        """处理豆包模型的逻辑"""
        if not self.page:
            print("错误: 浏览器未初始化")
            return
        try:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始处理...")
            try:
                input_selector = self.page.get_by_role("textbox", name="发消息")
            except Exception as e:
                print(f"通过test_id查找输入框失败: {e}")
                # 尝试其他选择器
                try:
                    input_selector = self.page.locator("textarea")
                    if input_selector.count() > 0:
                        input_selector = input_selector.first()
                        print("✓ 通过textarea找到输入框")
                    else:
                        raise Exception("未找到textarea输入框")
                except Exception as e2:
                    print(f"通过textarea查找输入框失败: {e2}")
                    # 尝试CSS选择器
                    input_selector = self.page.locator("[contenteditable=true]").first()
                    print("✓ 通过contenteditable找到输入框")
            try:
                input_selector.click()
                # 清除可能存在的文本
                input_selector.press("Control+A")
                input_selector.press("Delete")
                # 输入新文本
                input_selector.fill(input_text)
                print("✓ 文本输入完成")
            except Exception as e:
                print(f"输入文本失败: {e}")
                # 尝试其他输入方式
                self.page.keyboard.type(input_text)
            # 发送消息
            print("正在发送消息...")
            try:
                # 查找发送按钮
                send_button = self.page.locator("#flow-end-msg-send")
                # time.sleep(0.1)
                send_button.click()
            except Exception as e:
                print(f"通过test_id点击发送按钮失败: {e}")
                # 尝试其他方式
                try:
                    self.page.locator('button[type="submit"]').click()
                except:
                    self.page.keyboard.press("Enter")

            print("✓ 消息已发送")
            storage=self.context.storage_state(path=self.auth_path)





        except TimeoutError:
            print("操作超时，请检查网络或重试")
        except Exception as e:
            print(f"豆包处理出错: {str(e)}")
            import traceback
            print(f"详细错误:\n{traceback.format_exc()}")

    def run(self):
        """运行主循环"""
        print("=" * 50)
        print("Doubao 命令行工具")
        print("=" * 50)

        try:
            while True:
                # 获取输入类型
                input_type = self.get_input_type()

                if input_type == 'exit':
                    print("\n感谢使用，再见！")
                    break

                elif input_type == 'text':
                    # 获取文字输入
                    input_text = self.get_text_input()
                    if input_text:
                        self.process_input(input_text=input_text)
                    else:
                        print("输入为空，请重新选择")

                elif input_type == 'file':
                    # 获取文件输入
                    file_path = self.get_file_input()
                    if file_path:
                        self.process_input(file_path=file_path)
                    else:
                        print("文件路径无效，请重新选择")

        except KeyboardInterrupt:
            print("\n\n检测到中断信号，正在退出...")
        except Exception as e:
            print(f"\n程序运行出错: {str(e)}")
            import traceback
            print(f"详细错误:\n{traceback.format_exc()}")
        finally:
            self.cleanup()


def main():
    """主函数"""
    try:
        cli = DoubaoCLI()
        cli.run()
    except Exception as e:
        print(f"程序启动失败: {str(e)}")
        print("请检查：")
        print("1. 是否安装了Playwright（运行: pip install playwright）")
        print("2. 是否安装了浏览器（运行: playwright install）")
        print("3. 网络连接是否正常")
        import traceback
        print(f"\n详细错误:\n{traceback.format_exc()}")
        input("\n按回车键退出...")


if __name__ == "__main__":
    main()