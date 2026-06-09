---
name: CodeNest Elite
colors:
  surface: '#101413'
  surface-dim: '#101413'
  surface-bright: '#363a39'
  surface-container-lowest: '#0b0f0e'
  surface-container-low: '#181c1b'
  surface-container: '#1c201f'
  surface-container-high: '#262b2a'
  surface-container-highest: '#313634'
  on-surface: '#e0e3e1'
  on-surface-variant: '#bccac0'
  inverse-surface: '#e0e3e1'
  inverse-on-surface: '#2d3130'
  outline: '#87948b'
  outline-variant: '#3d4a42'
  surface-tint: '#68dca5'
  primary: '#7befb6'
  on-primary: '#003823'
  primary-container: '#5ed29c'
  on-primary-container: '#005839'
  inverse-primary: '#006c48'
  secondary: '#bec9c4'
  on-secondary: '#28332f'
  secondary-container: '#3e4945'
  on-secondary-container: '#acb8b3'
  tertiary: '#ffcebb'
  on-tertiary: '#552004'
  tertiary-container: '#ffa882'
  on-tertiary-container: '#793b1d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#85f9c0'
  primary-fixed-dim: '#68dca5'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005235'
  secondary-fixed: '#dae5e0'
  secondary-fixed-dim: '#bec9c4'
  on-secondary-fixed: '#141e1b'
  on-secondary-fixed-variant: '#3e4945'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#723618'
  background: '#101413'
  on-background: '#e0e3e1'
  surface-variant: '#313634'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  eyebrow-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  emphasis-italic:
    fontFamily: Instrument Serif
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  grid-line-width: 1px
  grid-line-color: rgba(94, 210, 156, 0.08)
---

## Brand & Style

The design system is engineered for a premium, high-focus coding environment. It targets serious developers and learners who value a sophisticated, "deep-work" atmosphere. The brand personality is technical, precise, and visionary—evoking the feeling of a futuristic terminal interface blended with editorial luxury.

The visual style is **Liquid Glassmorphism** set against a **Deep Minimalism** backdrop. It utilizes a high-contrast relationship between an obsidian-void background and vibrant, bioluminescent green accents. The aesthetic relies on structural integrity through thin grid lines, luminous glows, and the interplay of sharp typography with soft, translucent surfaces.

## Colors

The palette is optimized for OLED displays and long-duration coding sessions. 
- **Primary Green (#5ed29c):** Used exclusively for progress, primary actions, and "active code" states. It should feel like a light source.
- **Surface Tones:** The background is a singular deep black-green (#070b0a). Secondary surfaces use a slightly lifted #1a2421 with 40% opacity to create the glass effect.
- **Typography:** Avoid pure #FFFFFF. Use 90% opacity for headers, 70% for body, and 50% for metadata to establish hierarchy without causing eye strain.

## Typography

This design system employs a sophisticated three-font stack to balance technicality with editorial grace.
- **Inter (Extra Bold):** Used for impactful headlines. The tight letter spacing and heavy weight create a "blocked" look that feels architectural.
- **Plus Jakarta Sans:** Used for navigation, eyebrows, and functional labels. Its friendly but modern curves soften the technical edges.
- **Instrument Serif (Italic):** Used sparingly for pull-quotes, decorative emphasis, or "mentor tips" to provide a human, high-end touch amidst the code.

## Layout & Spacing

The system follows a strict 8px square grid. Layouts should be structured using a **Fixed Grid** for desktop (12 columns) and a **Fluid Grid** for mobile.

Distinctive to this system is the **Visible Grid Philosophy**. Use thin 1px lines to separate major sections, creating a "blueprint" feel. Padding within cards should be generous (minimum 32px) to maintain the minimalist aesthetic. Elements should feel like they are floating within a structured matrix.

## Elevation & Depth

Depth is conveyed through **Liquid Glassmorphism** rather than traditional shadows.
1.  **Level 0 (Base):** The deep #070b0a background.
2.  **Level 1 (Cards):** Background-blur (24px) with a 10% white fill and a 1px border at 15% opacity.
3.  **Level 2 (Modals/Popovers):** Background-blur (40px) with a subtle "Luminosity" blend mode to pull colors from the content beneath.
4.  **The Glow:** Active elements (like the current lesson or a "Run Code" button) emit a soft, 20px radius outer glow using the primary green at 20% opacity.

## Shapes

The design system uses a **Soft (0.25rem)** base roundedness to maintain a precise, technical feel without being aggressive. 
- **Standard UI (Buttons, Inputs):** 4px (0.25rem) radius.
- **Glass Containers:** 8px (0.5rem) radius.
- **Interactive States:** On hover, borders should transition from a neutral low-opacity white to a 1px solid Primary Green.

## Components

- **Primary Button:** Solid #5ed29c fill with black text (Inter Extra Bold). High-glow effect on hover.
- **Secondary Button:** Ghost style with 1px white border (20% opacity) and white text.
- **Code Editor Surface:** 0% opacity background with a 1px grid-line border. Syntax highlighting should use the Primary Green for keywords.
- **Progress Chips:** Small, pill-shaped elements with #5ed29c text and a 10% opacity green background.
- **Input Fields:** Darker than the background (#000000), 1px bottom-border only, using Plus Jakarta Sans for the placeholder text.
- **Glass Cards:** Used for course modules. Must include a subtle top-left "light leak" highlight to enhance the glass effect.