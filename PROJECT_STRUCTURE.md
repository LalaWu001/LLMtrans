# Project Structure

## Root

- `Core_Architecture/`: Existing Python crawler and cookie/dialogue assets. The current plan is to avoid modifying the core crawler scripts directly.
- `src/`: Existing React frontend source.
- `index.html`: Vite application entry for the React UI prototype.
- `package.json`: Local Vite/React scripts for running and building the interactive UI.
- `vite.config.ts`: Vite configuration with React and Tailwind plugins.
- `tsconfig.json`: TypeScript configuration for the React UI.
- `electron/main.cjs`: Electron main process, IPC registration, native file dialogs, database/worker lifecycle, and application window.
- `electron/preload.cjs`: Context-isolated renderer API exposing the approved auth, file, conversation, and message operations.
- `electron/database.cjs`: SQLite schema and persistence for local accounts, conversations, messages, and settings.
- `electron/worker-manager.cjs`: Single-active-conversation manager for the original sender and receiver Python processes.
- `build/icon.png`: Source application icon retained outside Vite's generated `dist/` directory.
- `build/icon.ico`: Multi-size Windows icon used by the Electron window and packaged executable.
- `public/backgrounds/main-bg.jpg`: Local background image used by the authenticated app pages (`Project`, `Chat`, `VPN`, `Settings`, `About`).
- `server/`: Deprecated experimental HTTP bridge. It is not used by the Electron application and will not be extended.
- `scripts/install-dependencies.cmd`: Double-click launcher distributed as `安装运行环境.cmd`.
- `scripts/install-dependencies.ps1`: Installs or verifies Python 3.12, Playwright, chardet, and Playwright Chromium for the current Windows user.
- `docs/`: Project planning and design documents.
- `website/`: Standalone four-page project showcase. `index.html`, `conversation.html`, `vpn.html`, and `team.html` share a compact top-left navigation, independent top-right download action, mobile drawer, unavailable-feature notices, and bilingual product copy while retaining page-specific background videos. Shared `script.js` intercepts every client download link and opens the invitation-code prompt; `styles.css` contains its responsive editorial styling. `IMG_5716.PNG` is the unified site icon.
- `PROJECT_STRUCTURE.md`: Maintains project file and module responsibilities.
- `CHANGELOG.md`: Maintains notable project changes.
- `README.md`: Public setup, local secret configuration, development, website preview, and GitHub Releases instructions.
- `.gitignore`: Prevents local credentials, session data, databases, dependencies, virtual environments, and build artifacts from entering Git history.

## Docs

- `docs/stitch-ui-prompt.md`: Stitch prompt for the second-version desktop UI visual design, including register, project, chat, VPN, settings, and about pages.
- `stitch/`: Stitch-generated static UI pages. `register_smegaphone`, `chat_smegaphone`, and `settings_smegaphone` have been revised to better match the intended desktop flow and glass visual language.

## Current Architecture Notes

- Existing crawler scripts remain unchanged and are launched as long-running child processes by `electron/worker-manager.cjs`.
- Starting a conversation launches `Core_Architecture/cmd/1.py` and `Core_Architecture/cmd_reserve/1.py`. The saved Cookie path and dialogue path are written once to each process through stdin.
- The built-in conversation is created automatically with `Core_Architecture/cookies/cookies.json` and `Core_Architecture/test/test5.txt`.
- Subsequent sends reuse the existing sender process and write only the original script menu command plus the encoded message payload.
- Only one conversation may run at a time. Starting another conversation first stops both workers from the previous conversation.
- React communicates only through the context-isolated preload API. It cannot access SQLite, child processes, or arbitrary filesystem APIs directly.
- The React chat UI now loads accounts, conversations, and messages from the Electron backend rather than demo arrays.
- The React UI uses a shared liquid-glass visual system in `src/index.css`, now aligned with the user's SiameseBlog glass style. Authenticated pages use `public/backgrounds/main-bg.jpg`; the login page remains the only page with a user-selectable image background.
- Windows packaging target is a portable single executable named `llmtrans.exe` generated under `release/`.
- Windows packaging and the Electron window use `build/icon.ico` as the llmtrans application icon.
- Vite uses `base: './'` so JavaScript, CSS, and local background assets resolve correctly when Electron loads the app through `file://`.

## Local Data

- SQLite path: `<Electron userData>/data/llmtrans.db`.
- Tables: `accounts`, `conversations`, `messages`, `app_settings`.
- Account names are immutable communication identifiers; nicknames are display values.
- The active login is process-local memory, not a shared SQLite setting. Two application instances on one computer can therefore log in as different accounts without overwriting each other's identity.
- Message ownership is calculated when messages are loaded: `sender_account` equal to the current account renders as self, and every other account renders as peer. This keeps one device's shared conversation history correct when switching local accounts.
- React repeats the final ownership check while rendering: only a message whose `senderAccount` matches that window's logged-in `accountName` is placed on the right.
- Conversation rows persist the absolute Cookie and dialogue file paths.
- Message IDs are UUIDs and the database primary key prevents duplicate storage.

## IPC Surface

- Authentication: `auth:current`, `auth:register`, `auth:login`, `auth:logout`.
- The top-navigation logout action stops both active Python workers before clearing the current local account session.
- Every newly opened application instance requires its own login; account records and conversation history remain shared in SQLite.
- File selection: `files:choose-cookie`, `files:choose-dialogue`.
- Conversations: `conversations:list`, `conversations:create`, `conversations:start`, `conversations:stop`, `conversations:status`.
- Messages: `messages:list`, `messages:send`.
- Renderer events: `worker:status`, `worker:error`, `messages:new`.

## Packaging Constraint

- Current-machine builds use the installed Python 3 selected by `py -3`; this machine has the required `playwright`, `chardet`, and Playwright Chromium installation.
- `release/win-unpacked/安装运行环境.cmd` prepares these prerequisites on another Windows test computer.
- The original `.venv` directories are not packaged because their `pyvenv.cfg` files point to another machine's `C:\Users\lenovo\...\Python313` installation.
- A cross-machine green package still requires either documented Python/Playwright prerequisites or an embedded Python runtime and bundled Playwright Chromium.
