# Stitch UI Prompt: SMegaphone Desktop Chat Client

## Purpose

Create a polished desktop application UI concept for a local chat client named **SMegaphone**. The app looks like a modern messaging product, but its communication layer is experimental and routes messages through a shared AI web conversation. Do not expose crawler or implementation details in the UI.

This prompt is for a **second-version visual design**. The first implementation will only build a fixed chat screen, but the design should include the full future navigation structure.

## Output Requirements

Generate a complete HTML and CSS interface. Use clean semantic structure, reusable classes, and responsive desktop-first layout. The design should be suitable for later conversion into Electron + React components.

Do not use external JavaScript frameworks. Minimal vanilla JavaScript is acceptable only for visual demos such as tab switching, animated counters, fake traffic waves, or theme preview.

Use a refined desktop-app style: professional, modern, high-tech, readable, and suitable for a university research project. Avoid a marketing landing-page feel. The UI should feel like an actual usable app.

## Global App Structure

The application has a top navigation bar for all pages except that the chat page additionally has its own left conversation sidebar.

Top navigation pages:

- Register
- Project
- Chat
- VPN
- Settings
- About

Only the **Chat** page has a left sidebar. Other pages use full-width content under the top bar.

## Visual Style

Use an **Apple-inspired premium desktop UI style** with a futuristic glassmorphism layer. The interface should feel like a high-end macOS native app mixed with a research-grade communication console.

Style keywords:

- Apple-like clarity
- Premium glass UI
- Frosted glass panels
- High-end technology product
- Calm futuristic interface
- Elegant desktop software
- Soft depth and layered translucency
- Precise spacing and typography
- Refined macOS-style controls
- Minimal but not empty

Use a dark default theme with an optional light theme preview in Settings. The default theme should use:

- Deep neutral background, not pure black
- Glass-like surfaces with restrained blur
- Crisp borders and subtle shadows
- Blue, cyan, white, and small green accents
- Rounded corners around 8px to 14px, not overly pill-shaped except status badges or primary controls
- Clear typography hierarchy
- Smooth but not excessive glow effects

Avoid cartoon style, childish colors, overdecorated gradients, and large marketing hero sections.

## Layout Wireframes

Use these wireframes as the structural reference. The final UI should look much more polished than the wireframes, but the page hierarchy should remain the same.

### Register Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+-------------------------------------------------------------+
|                                                             |
|   +------------------------+   +-------------------------+   |
|   | App Logo               |   | Create Account           |   |
|   | SMegaphone             |   | Nickname                 |   |
|   | Local research client  |   | Account                  |   |
|   | Academic use notice    |   | Password                 |   |
|   | Security notes         |   | Confirm Password         |   |
|   |                        |   | Avatar Upload            |   |
|   |                        |   | [Create Account]         |   |
|   |                        |   | Use local profile        |   |
|   +------------------------+   +-------------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

### Project Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+-------------------------------------------------------------+
|                                                             |
|  SMegaphone                                                 |
|  Experimental AI-mediated desktop communication client       |
|                                                             |
|  +------------------+  +------------------+  +-------------+ |
|  | Shared Channel   |  | Local Identity   |  | Desktop Flow | |
|  +------------------+  +------------------+  +-------------+ |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Desktop UI -> Local Bridge -> Python Workers -> AI Chat | |
|  +-------------------------------------------------------+  |
|                                                             |
|  +---------------------+   +-----------------------------+  |
|  | System Status       |   | Academic Only Statement      |  |
|  +---------------------+   +-----------------------------+  |
|                                                             |
+-------------------------------------------------------------+
```

### Chat Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+----------------------+--------------------------------------+
| LEFT CHAT SIDEBAR    | Active Conversation                  |
|                      | Online | AI: Doubao | Actions        |
| + New Conversation   +--------------------------------------+
|                      |                                      |
| Cookies File [Pick]  |   peer avatar  Name  20:10           |
| Dialog File  [Pick]  |   +----------------------------+     |
| Name        [_____]  |   | hello                      |     |
| [Create]             |   +----------------------------+     |
|                      |                                      |
| Conversations        |                         Me 20:11     |
| + Chat A             |           +---------------------+    |
| | last message  2    |           | hi                  |    |
| + Chat B             |           +---------------------+    |
| + Chat C             |                                      |
|                      |       --- system notice ---          |
| Local Profile        |                                      |
| avatar nickname      |                                      |
|                      +--------------------------------------+
|                      | attach | message input... | send     |
+----------------------+--------------------------------------+
```

### VPN Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+-------------------------------------------------------------+
|                                                             |
|       +------------------ VPN STATUS ------------------+     |
|       |                                                |     |
|       |              animated traffic wave             |     |
|       |                                                |     |
|       |                 [ POWER BUTTON ]               |     |
|       |                                                |     |
|       |              Disconnected / Protected          |     |
|       +------------------------------------------------+     |
|                                                             |
|  +-----------+ +-----------+ +-----------+ +-------------+   |
|  | Download  | | Upload    | | Traffic   | | Duration    |   |
|  +-----------+ +-----------+ +-----------+ +-------------+   |
|                                                             |
|  Proxy Mode: [Global] [Rule-based] [Direct] [Research Tunnel]|
|                                                             |
|  +-------------+ +-------------+ +-------------+             |
|  | Server A    | | Server B    | | Server C    |             |
|  +-------------+ +-------------+ +-------------+             |
|                                                             |
+-------------------------------------------------------------+
```

### Settings Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+-------------------------------------------------------------+
|                                                             |
| +----------------------+  +-------------------------------+ |
| | Profile              |  | Communication AI              | |
| | Avatar Upload        |  | Doubao / Other / Custom       | |
| | Nickname             |  +-------------------------------+ |
| | Local User ID [Copy] |                                  |
| +----------------------+  +-------------------------------+ |
|                         | Theme Style                    | |
|                         | Dark / Light / High Contrast   | |
|                         +-------------------------------+ |
|                                                             |
| +----------------------+  +-------------------------------+ |
| | Message Behavior     |  | File Storage                  | |
| | Polling interval     |  | Cookies folder                | |
| | Show echoed messages |  | Conversation folder           | |
| | Save local history   |  | Log folder                    | |
| +----------------------+  +-------------------------------+ |
|                                                             |
+-------------------------------------------------------------+
```

### About Page

```text
+-------------------------------------------------------------+
| SMegaphone | Register | Project | Chat | VPN | Settings | About |
+-------------------------------------------------------------+
|                                                             |
|  SMegaphone                                                 |
|  Built for academic research and prototype validation        |
|                                                             |
|  +----------------+ +----------------+ +----------------+   |
|  | Teacher        | | Student 1      | | Student 2      |   |
|  | avatar         | | avatar         | | avatar         |   |
|  | Supervisor     | | Developer      | | Developer      |   |
|  | Contribution   | | Contribution   | | Contribution   |   |
|  +----------------+ +----------------+ +----------------+   |
|                                                             |
|  +-------------------------------------------------------+  |
|  | University / Lab / Research project information        |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Version info | Acknowledgements | Academic use notice       |
+-------------------------------------------------------------+
```

## Page 1: Register

Design an account registration screen for the desktop app.

Content:

- App logo and name: SMegaphone
- Short subtitle: "Local research chat client"
- Registration form with nickname, account name, password, confirm password
- Optional avatar upload preview
- Primary button: "Create Account"
- Secondary link: "Use local profile instead"
- Small academic-use notice

Layout:

- Top navigation bar remains visible
- Centered registration panel
- Left side may show app identity and security notes
- Right side contains the form
- No chat sidebar on this page

## Page 2: Project

Create a main project introduction page. It should explain the project without feeling like a public landing page.

Content:

- Project name: SMegaphone
- Short description: "A desktop chat client for experimental AI-mediated communication research"
- Three feature blocks:
  - Shared conversation channel
  - Local identity protocol
  - Desktop client workflow
- System status preview card
- Simple architecture strip showing: Desktop UI -> Local Bridge -> Python Workers -> Shared AI Conversation
- Academic-only statement

Layout:

- Top navigation bar
- Dense, dashboard-like intro layout
- First screen should show project name, status card, and architecture preview
- No left sidebar

## Page 3: Chat

Create a messaging interface similar to mainstream chat applications.

This page must include a left sidebar.

Left sidebar:

- App name compact header
- Button or compact panel: "New Conversation"
- Small widget to select:
  - Cookies file
  - Conversation file
  - Conversation name
  - Button: "Create"
- Conversation list with multiple chat items
- Each item shows conversation name, last message preview, time, and unread badge
- Bottom area shows current local profile

Main chat area:

- Header with active conversation name, connection status, current communication AI selector, and small actions
- Message list with left and right bubbles
- System messages in centered muted style
- Sender avatar, nickname, timestamp
- Bottom input bar with text area, attach/file icon, send button
- Connection status indicator: Connecting, Online, Error

Important behavior represented visually:

- Own messages appear on the right
- Peer messages appear on the left
- System notices are centered
- Message bubbles should be readable and not too wide

No need to mention crawler implementation.

## Page 4: VPN

Create a visually impressive VPN-style page. This page is only a frontend visual concept and is unrelated to the current communication implementation.

Content:

- Large central power/start button
- Fake animated traffic wave or circular pulse
- Connection status: Disconnected / Connecting / Protected
- Fake traffic display:
  - Upload speed
  - Download speed
  - Total traffic
  - Session duration
- Proxy mode selector:
  - Global
  - Rule-based
  - Direct
  - Research Tunnel
- Region/server selector cards
- Small diagnostic cards: latency, packet loss, encryption mode

Layout:

- Top navigation bar
- Central control area
- Side or bottom metrics grid
- More futuristic and animated than the other pages, but still consistent with the app
- No chat sidebar

## Page 5: Settings

Create a settings page for local profile and app preferences.

Content:

- Avatar upload and preview
- Nickname edit field
- Local user ID display, copy button
- Communication AI selector:
  - Doubao
  - Other AI placeholder
  - Custom provider placeholder
- Theme style selector:
  - Dark
  - Light
  - High contrast
  - Blue research theme
- Message behavior settings:
  - Polling interval
  - Show own echoed messages
  - Save local history
- File storage section:
  - Default cookies folder
  - Default conversation folder
  - Local log folder

Layout:

- Top navigation bar
- Two-column settings layout
- Profile card on the left
- Detailed settings panels on the right
- No chat sidebar

## Page 6: About

Create an about/team page.

Content:

- App name: SMegaphone
- Research statement: "Built for academic research and prototype validation"
- Team section with three people:
  - Teacher / supervisor
  - Student 1
  - Student 2
- Each person card should include avatar placeholder, role, name placeholder, and contribution summary
- University/research lab placeholder area
- Version info and acknowledgements

Layout:

- Top navigation bar
- Balanced team grid
- Clear project statement at top
- Footer with academic-use notice
- No chat sidebar

## Component Guidance

Design reusable visual components:

- Top navigation
- Status badge
- File picker widget
- Conversation list item
- Message bubble
- Avatar component
- Settings panel
- Metric card
- VPN mode segmented control
- Team member card

Make sure text does not overlap or overflow. Use fixed and responsive dimensions for sidebars, message bubbles, buttons, and cards.

## Final Design Goal

The final interface should look like a credible desktop chat application with research-tool depth. It should be attractive enough for demonstration, but structured enough to convert into production Electron + React code.
