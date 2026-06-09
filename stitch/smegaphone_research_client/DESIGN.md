---
name: SMegaphone Research Client
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#a6e6ff'
  on-secondary: '#003543'
  secondary-container: '#14d1ff'
  on-secondary-container: '#00566b'
  tertiary: '#53e16f'
  on-tertiary: '#003911'
  tertiary-container: '#00a741'
  on-tertiary-container: '#00320e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#72fe88'
  tertiary-fixed-dim: '#53e16f'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#00531c'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353437'
  glass-surface: rgba(28, 28, 30, 0.7)
  glass-border: rgba(255, 255, 255, 0.12)
  text-primary: '#FFFFFF'
  text-secondary: '#8E8E93'
  status-online: '#34C759'
  status-busy: '#FF3B30'
  sidebar-bg: rgba(44, 44, 46, 0.6)
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-page: 32px
  sidebar-width: 300px
  topbar-height: 52px
  gutter-md: 16px
  stack-sm: 8px
  stack-xs: 4px
---

## Brand & Style

The design system is centered on a **Premium Desktop/macOS** aesthetic, specifically tailored for a high-end academic research environment. It avoids the playfulness of consumer apps in favor of a "Research-Grade Console" feel—sophisticated, precise, and technologically advanced.

The primary design movement is **Glassmorphism**, utilized with restraint to ensure legibility and professional rigor.

### Key Visual Principles:
- **Atmospheric Depth:** Layers are defined by varying levels of background blur (10px to 40px) and semi-transparent fills rather than heavy drop shadows.
- **Precision Engineering:** Elements utilize thin (0.5pt to 1pt) high-contrast borders to simulate a hardware-like edge.
- **Academic Serenity:** High whitespace and a "Dark Default" theme reduce eye strain during long research sessions.
- **Refined Interactivity:** Transitions are subtle, mimicking the physical properties of frosted glass and light-emitting diodes (LEDs).

## Colors

The palette is anchored in a **Deep Neutral** foundation, using a base of `#1C1C1E` (macOS Dark Mode gray) instead of pure black to maintain depth and detail in shadows.

### Palette Strategy:
- **Primary (Blue):** `#007AFF` for primary actions and "Me" message bubbles.
- **Secondary (Cyan):** `#00D1FF` for active system highlights, progress bars, and high-tech accents.
- **Tertiary (Green):** `#34C759` strictly for "Online" status indicators and successful connection states.
- **Translucency:** Surface colors should use `rgba` values to allow background content and blurs to bleed through. The "Glass Surface" serves as the standard container background.

## Typography

This design system uses **Inter** for its systematic, utilitarian nature, which mirrors the functional clarity of a research tool. 

### Font Roles:
- **Headlines:** Use tighter letter-spacing and heavier weights for a condensed, impactful look in registration and project headers.
- **Body:** 13px is the standard desktop application size for chat bubbles and sidebar items, providing high density without sacrificing legibility.
- **Monospaced:** **JetBrains Mono** is utilized for technical metadata, local user IDs, and architecture strips to emphasize the "data-driven" aspect of the software.
- **Labels:** Uppercase labels with slight tracking are used for section headers in the Sidebar and Settings.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model typical of professional desktop suites. 

### Structure:
- **Navigation:** A global top bar (52px) provides consistent context. It uses a `backdrop-filter: blur(20px)` to stay distinct from the content below.
- **Sidebar:** The Chat sidebar is fixed at 300px. It contains internal scrolling for conversation history.
- **Grid:** Use a 12-column grid for the "Project" and "About" pages, while the "VPN" page uses a flexible central layout.
- **Density:** Spacing is compact (`8px` units) to allow for significant data display, reflecting the app's use as a research tool rather than a social media platform.

## Elevation & Depth

Depth is achieved through **Material Stacking** and **Backdrop Blurs** rather than traditional elevation levels.

- **Level 0 (Base):** Deep neutral solid background.
- **Level 1 (Panels):** `glass-surface` with `1px` border (`glass-border`). Used for sidebars and the main chat container.
- **Level 2 (Popovers/Modals):** Lighter translucent fill with a double border (inner 1px white at 5% opacity, outer 1px black at 20% opacity) and a large (30px) diffused shadow.
- **Focus:** Active states for input fields should use a subtle cyan outer glow (`0 0 0 3px rgba(0, 209, 255, 0.2)`).

## Shapes

The shape language is "Soft-Modern." It avoids the "pill" shapes of mobile-first social apps, preferring the balanced geometry of macOS desktop windows.

- **Standard Elements (Buttons, Inputs, Cards):** 8px corner radius.
- **Container Elements (Sidebar, Main Chat Area):** 12px-14px corner radius.
- **Status Badges:** Fully rounded (pill) to distinguish them from interactive buttons.
- **Avatars:** Circles are used to provide a soft organic break in the otherwise geometric layout.

## Components

### Buttons & Controls
- **Primary:** Solid `#007AFF` with white text. 
- **Glass Action:** Translucent background with `glass-border`. Becomes slightly more opaque on hover.
- **Segmented Control:** Used in VPN Mode and Settings. A container with a sliding glass "thumb" that highlights the active selection.

### Messaging
- **Me Bubbles:** Solid Primary Blue, aligned right. 
- **Peer Bubbles:** Glass Surface with a subtle border, aligned left.
- **System Notices:** Text-only, centered, using `label-caps` typography.

### Inputs & Pickers
- **Text Fields:** Darker inset background with a 1px border.
- **File Picker Widget:** A specialized card with a "Browse" icon, the file name in `mono-sm`, and a "Clear" action.

### Metric Cards (VPN/Status)
- **Data Display:** Uses `headline-md` for the value and `label-caps` for the description.
- **Traffic Wave:** A subtle, low-opacity SVG path animation with a cyan glow to indicate active data flow.

### Team Cards
- **Structure:** Vertical stack with a circular avatar, Name in `body-lg`, and Role in `label-caps` (colored in Secondary Cyan).