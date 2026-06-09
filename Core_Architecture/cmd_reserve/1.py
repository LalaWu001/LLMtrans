import re
import sys
import time
import os
import chardet
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError
def wait_for_network_idle(page):
    """等待网络请求完成"""
    page.wait_for_load_state('load', timeout=30000)
    return True
def clear_screen():
    """清屏函数"""
    os.system('cls' if os.name == 'nt' else 'clear')
def print_status(message):
    """打印状态信息"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
def print_output(response, is_new=True):
    """格式化输出AI响应"""
    if is_new:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        print(response)
    else:
        None

def get_file_path(prompt, default=None):
    """获取文件路径"""
    while True:
        path = input(f"{prompt}: ").strip()
        if not path and default:
            return default
        elif os.path.exists(path):
            return path
        else:
            print(f"文件不存在: {path}")
            if default and os.path.exists(default):
                use_default = input(f"使用默认路径 {default} 吗? (y/n): ").lower()
                if use_default == 'y':
                    return default


class AIOutputProcessor:
    def __init__(self, auth_path, open_path, interval=10):
        """
        初始化AI输出处理器

        Args:
            auth_path: cookies文件路径
            open_path: 对话文件路径
            interval: 执行间隔（秒）
        """
        self.auth_path = auth_path
        self.open_path = open_path
        self.open_content = self.read_open_file(open_path)
        self.interval = interval
        self.running = False
        self.last_output = None
        # 浏览器相关实例变量
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.browser_initialized = False

        # 验证文件路径
        self.validate_paths()

    def validate_paths(self):
        """验证文件路径是否存在"""
        if not os.path.exists(self.auth_path):
            raise FileNotFoundError(f"认证文件不存在: {self.auth_path}")

        if not os.path.exists(self.open_path):
            raise FileNotFoundError(f"对话文件不存在: {self.open_path}")

    def read_open_file(self, file_path):
        """读取对话文件内容"""
        with open(file_path, "rb") as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            encoding = result["encoding"]
        with open(file_path, 'r', encoding=encoding) as file:
            file_content = file.read()
            return file_content


    def initialize_browser(self):
        """初始化浏览器和页面"""
        try:
            # 启动playwright

            self.playwright = sync_playwright().start()

            # 启动浏览器
            self.browser = self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox','--disable-blink-features=AutomationControlled'],
                timeout=60000
            )
            # 创建上下文
            print_status("创建浏览器上下文...")
            context_options = {
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
                "locale": "en-US",
                "timezone_id": "Asia/Shanghai",
                "java_script_enabled": True,
                "bypass_csp": True,
            }
            if os.path.exists(self.auth_path):
                context_options["storage_state"] = self.auth_path
            self.context = self.browser.new_context(**context_options)
            self.context.grant_permissions(['clipboard-read', 'clipboard-write'])
            self.page = self.context.new_page()
            self.page.goto("https://www.doubao.com/chat/", timeout=60000)
            wait_for_network_idle(self.page)
            # 额外等待核心元素（输入框）就绪，确保页面可交互
            self.page.get_by_role("textbox", name="发消息").wait_for(timeout=15000)


        except Exception as e:
            print_status(f"浏览器初始化失败: {e}")
            self.cleanup_browser_resources()
            raise

    def process_doubao(self):
        try:
            self.page.reload()

            link = self.page.get_by_role("link", name=self.open_content)
            link.wait_for(timeout=10000)
            link.click()

            # 等待新消息加载完成
            #time.sleep(1)
            #messages = self.page.get_by_test_id("send_message").get_by_test_id("message_content").get_by_test_id(
            #    "message_text_content")
            #messages.last.wait_for(timeout=15000)
            messages=self.page.get_by_text(re.compile(r'#不管我输入什么你都回复"1"$'))
            if messages.last.text_content()[0] == '#' and (
                    messages.last.text_content()[2] == '#' or messages.last.text_content()[3] == '#' or
                    messages.last.text_content()[4] == '#'):
                response_text = "接收到文件"
                return response_text
            elif messages.last.text_content()[-14:] != "不管我输入什么你都回复\"1\"":
                pass
            else:
                s = messages.last.text_content()
                hash_count = 0
                second_hash_pos = -1
                # 修正循环范围，遍历所有字符
                for i in range(len(s) - 1, -1, -1):
                    if s[i] == '#':
                        hash_count += 1
                        if hash_count == 2:
                            second_hash_pos = i
                            break
                result_str = s[:second_hash_pos]
                self.context.storage_state(path=self.auth_path)

                return result_str
            # 保存认证信息
            self.context.storage_state(path=self.auth_path)

        except TimeoutError:
            print_status("操作超时")
            return "Error: 操作超时，请检查网络或重试"
        except Exception as e:
            print_status(f"处理出错: {e}")
            return f"豆包处理出错: {str(e)}"

    def run_once(self):
        """单次执行"""
        if not self.browser_initialized:
            self.initialize_browser()
        output = self.process_doubao()
        # 打印输出
        print_output(output)
        return output
    def run_continuous(self):
        self.running = True
        try:
            if not self.browser_initialized:
                self.initialize_browser()

            while self.running:
                try:
                    # 执行间隔倒计时
                    for remaining in range(self.interval, 0, -1):
                        if not self.running:
                            break
                        time.sleep(1)
                        sys.stdout.flush()

                    if not self.running:
                        break
                    output = self.process_doubao()

                    # 检查输出是否变化
                    is_new = (output != self.last_output)
                    print_output(output, is_new)

                    if is_new:
                        self.last_output = output

                except Exception as e:
                    print_status(f"执行过程中出错: {e}")
                    time.sleep(2)
                    continue

        except Exception as e:
            self.stop()


    def stop(self):
        """停止执行"""
        self.running = False  # 设置标志
        self.cleanup_browser_resources()

    def cleanup_browser_resources(self):
        """清理浏览器相关资源"""
        if self.page:
            try:
                self.page.close()
            except:
                pass
            self.page = None

        if self.context:
            try:
                self.context.close()
            except:
                pass
            self.context = None

        if self.browser:
            try:
                self.browser.close()
            except:
                pass
            self.browser = None

        if self.playwright:
            try:
                self.playwright.stop()
            except:
                pass
            self.playwright = None

        self.browser_initialized = False


def main():
    """主函数"""
    # 检查是否有默认文件
    default_auth = "cookies.json" if os.path.exists("cookies.json") else None
    default_input = "dialog.txt" if os.path.exists("dialog.txt") else None

    # 交互式获取参数
    print("=" * 80)
    print(" " * 30 + "AI OUTPUT DISPLAY")
    print("=" * 80)

    # 获取认证文件路径
    auth_path = get_file_path("请输入cookies文件路径", default_auth)

    # 获取对话文件路径
    open_path = get_file_path("请输入对话文件路径", default_input)
    # 获取间隔时间
    interval = 1

    processor = AIOutputProcessor(
            auth_path=auth_path,
            open_path=open_path,
            interval=interval
    )
    processor.run_continuous()

if __name__ == "__main__":
    main()