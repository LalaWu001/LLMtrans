# LLMtrans

LLMtrans 是一个面向实验性 AI 中介通信研究的 Windows 桌面客户端。项目包含 React 桌面界面、Electron 本地应用层、Python 通信脚本，以及位于 `website/` 的产品展示网站。

> 本仓库仅保存源码、公开素材和安全配置示例。Cookie、会话标识、数据库、虚拟环境与打包产物不会提交。

## 克隆仓库

项目远端使用 SSH：

```bash
git clone git@github.com:LalaWu001/LLMtrans.git
cd LLMtrans
```

如果是已经存在的本地目录：

```bash
git init
git branch -M main
git remote add origin git@github.com:LalaWu001/LLMtrans.git
git fetch origin
```

验证 GitHub SSH：

```bash
ssh -T git@github.com
```

## 环境要求

- Windows 10/11
- Node.js 与 npm
- Python 3.12 或兼容版本
- Playwright、Chromium、chardet

安装 Node.js 依赖：

```bash
npm install
```

安装 Python 运行环境：

```powershell
.\scripts\install-dependencies.ps1
```

## 本地配置

真实 Cookie 和会话文件属于敏感信息，已被 `.gitignore` 排除。

1. 复制 Cookie 示例：

```powershell
Copy-Item Core_Architecture\cookies\cookies.example.json Core_Architecture\cookies\cookies.json
```

2. 将浏览器导出的有效 Cookie/Storage 内容写入 `Core_Architecture/cookies/cookies.json`。不要提交该文件。

3. 复制会话配置示例：

```powershell
Copy-Item Core_Architecture\test\test5.example.txt Core_Architecture\test\test5.txt
```

4. 将本地使用的会话标识写入 `Core_Architecture/test/test5.txt`。不要提交该文件。

也可以在桌面客户端中新建会话，并通过文件选择器指定其他本地 Cookie 和会话文件。

## 运行桌面界面

开发模式：

```bash
npm run dev
```

类型检查与构建：

```bash
npm run typecheck
npm run build
```

运行 Electron 开发版本：

```bash
npx electron .
```

生成 Windows 便携版：

```bash
npm run electron:build
```

生成结果位于 `release/`，该目录不会提交到 Git。

## 展示网站

展示网站入口：

```text
website/index.html
```

可以直接打开，也可以使用本地静态服务器：

```bash
python -m http.server 8000 --directory website
```

然后访问 `http://127.0.0.1:8000/`。

网站页面使用外部视频资源。部署到博客子目录时，请保持 `website/` 内文件的相对路径结构。

## 发布客户端下载

不要将 `release/` 或 `llmtrans.exe` 提交进普通 Git 历史。请在 GitHub 仓库的 **Releases** 页面创建版本并上传：

```text
release/llmtrans.exe
```

最新版本固定下载地址：

```text
https://github.com/LalaWu001/LLMtrans/releases/latest/download/release_WINx64.zip
```

网站下载按钮可以使用该地址，从而自动指向最新正式版本。

## 安全约定

以下内容不得提交：

- `Core_Architecture/cookies/cookies.json`
- `Core_Architecture/test/test5.txt`
- `.env`、密钥、证书和访问令牌
- SQLite 数据库和本地登录状态
- `node_modules/`、`.venv/`
- `dist/`、`release/`、EXE 与压缩包

提交前建议运行：

```bash
git status --short
git diff --cached --stat
```

确认暂存区中没有真实 Cookie、用户数据或打包文件。

## 项目结构

- `src/`：React 前端
- `electron/`：Electron 主进程、本地数据库和工作进程管理
- `Core_Architecture/`：Python 通信脚本与本地配置目录
- `website/`：项目展示网站
- `scripts/`：运行环境安装脚本
- `docs/`：设计与项目文档

更完整的结构说明见 [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)。

## 使用范围

本项目目前是学术研究与原型验证项目。请仅在授权环境中使用，并妥善保管个人 Cookie、会话信息和本地数据。
