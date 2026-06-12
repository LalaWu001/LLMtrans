# Changelog

## 2026-06-12

- Added a persistent Chinese/English switch to the login page and authenticated desktop navigation, with localized copy across the main workspace.
- Replaced the placeholder About content with the website's real Nankai University team introduction and full-color portraits for Li Xiang, Yuxuan Wu, and Haoyang Shi.
- Removed the desktop-demo disclaimer from the bottom of the login/register panel.
- Fixed the black Vite debug page by installing an in-memory browser preview bridge whenever the Electron preload API is unavailable.
- Compressed the light theme background to a smaller JPEG asset to reduce browser decoding and transfer overhead.
- Added a persistent light/dark theme toggle to the desktop application's top navigation.
- Connected the Light theme to `public/backgrounds/light-bg.jpg` and added light-mode glass, navigation, form, chat, and login styling.
- Kept the existing Settings appearance choices synchronized with the top-navigation shortcut.

## 2026-06-10

- Improved mobile background video playback with inline autoplay attributes, hidden WebKit controls, non-interactive video layers, and playback retries after page visibility or first touch.

## 2026-06-09

- Added a shared invitation-code prompt to every showcase download link, including invalid-code feedback and the author's application email.
- Added repository-safe `.gitignore`, public README setup instructions, and sanitized Cookie/conversation configuration templates.
- Replaced Team page placeholder graphics with `avatar/teacher.jpg`, `avatar/student1.jpg`, and `avatar/student2.jpg`.
- Rebalanced the Team layout with a large full-color teacher portrait and consistent full-color image/text columns for student profiles.
- Removed the showcase glassmorphism surfaces in favor of transparent editorial layouts with fine divider lines.
- Rebalanced text alignment and reading width across the Conversation, VPN, Team, navigation, action, and mobile menu areas.
- Restored visible opening titles within the first viewport so each page begins with context instead of an empty video-only screen.
- Kept Conversation and VPN opening titles directly over their videos while moving detailed content below.
- Added editorial, non-technical product journey sections to Conversation and VPN; each page now contains more than 800 Chinese characters.
- Expanded product-oriented Chinese and English descriptions across all four showcase pages without exposing implementation details.
- Moved page content below the initial animation area so visitors scroll into product information instead of immediately covering the background video.
- Replaced the Conversation page center icon with a large `LLMTRANSchat` wordmark.
- Shortened the shared navigation into a compact top-left bar and moved the download action into an independent top-right button.
- Changed Conversation and VPN workspace actions to show a clear "feature not yet developed" notice instead of navigating to unfinished functionality.
- Added the home welcome message for the LLMtrans product family and matching English introductions throughout the site.
- Expanded the showcase into linked Home, Conversation, VPN, and Team pages with shared desktop/mobile navigation.
- Preserved the distinct supplied background video for every showcase page, including HLS playback on the VPN page.
- Reworked the home page into left/right text columns with no center glass panel so the central animation remains visible.
- Reused the previous liquid-glass landing composition as the Conversation introduction page.
- Standardized all page branding and favicons on `website/IMG_5716.PNG`.
- Added a standalone Chinese project showcase page under `website/`.
- Implemented the supplied full-screen looping video background and two-panel grayscale liquid-glass visual system.
- Added responsive mobile behavior, Lucide icons, a compact navigation menu, project download/workspace links, and llmtrans-specific research copy.
- Added `website/logo.svg` and documented the new showcase site in `PROJECT_STRUCTURE.md`.

## 2026-06-08

- Added `安装运行环境.cmd` and its PowerShell installer to release builds. It checks or installs Python 3.12, Playwright, chardet, and Chromium, then launches Chromium once for verification.
- Added final renderer-side ownership filtering so only messages whose `senderAccount` matches the current window account are displayed on the right.
- Fixed same-computer multi-instance identity collisions by moving the active login from shared SQLite `current_account_id` state into each Electron process's memory.
- New application instances now require independent login, allowing one instance to remain account A while another logs in as account B.
- Changed message ownership rendering to compare each stored `sender_account` with the currently logged-in account, allowing multiple local accounts on one computer to share one conversation history with correct left/right message placement.
- Added a top-navigation logout button that stops active crawler workers, clears the current local login session, and returns to the login page for account-switch testing.
- Replaced the frontend demo authentication flow with SQLite-backed local registration and login.
- Added `electron/database.cjs` with accounts, conversations, messages, settings, password hashing, migrations, and message deduplication.
- Added `electron/preload.cjs` with a context-isolated IPC API for authentication, native file selection, conversations, worker status, and messages.
- Added `electron/worker-manager.cjs` implementing one active conversation and two long-running original Python crawler processes.
- Conversation startup now passes the saved Cookie path and dialogue path once to both original scripts through stdin.
- Added an ASCII-safe `LLMTRANS1` message envelope containing message ID, account name, nickname, content, and timestamp.
- Reworked the React login and chat state to load real accounts, conversations, messages, and worker events from Electron.
- Added native Cookie/dialogue file selection, conversation start/stop controls, running-state send restrictions, and backend error display.
- Added React type dependencies, Electron API declarations, strict type checking, and an `electron:dir` build script.
- Configured unpacked builds to include both existing crawler scripts and their fixed Cookie/dialogue resources.
- Replaced the unusable copied virtual environments with the current machine's `py -3` runtime lookup.
- Added an automatically seeded fixed conversation using `Core_Architecture/cookies/cookies.json` and `Core_Architecture/test/test5.txt`.
- Limited packaged crawler resources to the two scripts and the fixed Cookie/dialogue files instead of copying broken `.venv` directories.
- Marked `server/` as deprecated; the application no longer uses the experimental HTTP bridge.
- Documented that cross-machine packaging still requires embedded Python and bundled Playwright Chromium.

## 2026-06-07

- Added `build/icon.png` from the supplied `dist/backgrounds/avatar.PNG` artwork.
- Generated a multi-size `build/icon.ico` and configured it as both the Electron window icon and Windows packaged executable icon.

## 2026-06-04

- Added `docs/stitch-ui-prompt.md` with a complete Stitch prompt for the future desktop UI design.
- Added `PROJECT_STRUCTURE.md` to document the current repository structure and planned desktop architecture.
- Added `CHANGELOG.md` to track future project changes.
- Updated `docs/stitch-ui-prompt.md` with Apple-inspired glassmorphism style guidance and embedded page wireframes.

## 2026-06-05

- Reworked `stitch/register_smegaphone/code.html` into a login-first gate page without the main app top navigation.
- Reworked `stitch/settings_smegaphone/code.html` to match the same Apple-like glass desktop style as the other pages.
- Reworked `stitch/chat_smegaphone/code.html` so the left sidebar is a conversation list with a cookie/dialogue file conversation creator instead of history/archive navigation.
- Replaced the previous React UI with a full interactive SMegaphone prototype covering login/register, project, chat, VPN, settings, and about pages.
- Added Vite project entry files: `package.json`, `index.html`, `vite.config.ts`, and `tsconfig.json`.
- Rebuilt `src/index.css` around a unified liquid-glass visual system inspired by the existing blog glass style.
- Updated `src/index.css` to more closely match the user's SiameseBlog liquid-glass style across all React pages, while preserving a replaceable image background on the login page.
- Added `public/backgrounds/main-bg.jpg` copied from the user's SiameseBlog assets and changed authenticated app pages to use this local background instead of an external URL.
- Added Electron packaging for a frontend-only portable Windows executable named `llmtrans.exe`.
- Renamed visible app branding from SMegaphone to `llmtrans` and added hover copyright text: `版权所有南开大学llmtrans团队`.
- Fixed the packaged Electron black screen by changing Vite output to relative asset paths with `base: './'`.
- Added an opt-in Electron smoke-test mode and verified both `release/win-unpacked/llmtrans.exe` and portable `release/llmtrans.exe` render the React root successfully.
