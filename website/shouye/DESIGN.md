---
name: Equilibrium
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6cf'
  on-secondary: '#2f3037'
  secondary-container: '#45464e'
  on-secondary-container: '#b4b4bd'
  tertiary: '#ffffff'
  on-tertiary: '#303037'
  tertiary-container: '#e3e1ea'
  on-tertiary-container: '#64646b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e1eb'
  secondary-fixed-dim: '#c6c6cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#45464e'
  tertiary-fixed: '#e3e1ea'
  tertiary-fixed-dim: '#c7c5ce'
  on-tertiary-fixed: '#1b1b21'
  on-tertiary-fixed-variant: '#46464d'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
  mono-stats:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '300'
    lineHeight: '1'
    letterSpacing: 0.02em
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style
The design system is centered on the concept of digital serenity and high-performance wellness. It targets high-achieving individuals seeking clarity and mental equilibrium. The aesthetic is a fusion of **Hyper-Minimalism** and **Liquid Glassmorphism**, creating an interface that feels like a precision instrument carved from light and water.

The emotional response should be one of "focused calm." By utilizing high-opacity whites and deep blurs against dark, rhythmic video backgrounds, the UI recedes to let the user's data and routine take center stage. The "Liquid" aspect is achieved through luminosity blending and organic, flowing transitions that contrast with the sharp, technical precision of the layout.

## Colors
The palette is strictly grayscale to maintain a state of "Equilibrium." 
- **Primary:** Pure White (#FFFFFF) is reserved for active states, primary text, and high-impact UI elements.
- **Secondary:** Zinc-400 (#A1A1AA) for secondary labels and inactive icons.
- **Surface:** The background is intended to be a dark, slow-motion video or a deep obsidian gradient (#09090B).
- **Liquid Glass:** Use high-opacity white fills with backdrop-filter blurs. The "Liquid" feel is achieved by using `mix-blend-mode: luminosity` on secondary glass layers to pull colors from the background video without introducing new hues.

## Typography
This design system uses **Geist** exclusively to leverage its technical, developer-centric precision which translates beautifully into a futuristic wellness context. 
- **Display and Headlines:** Use tight letter-spacing and medium weights to create a "machined" look.
- **Body Text:** Keep line heights generous (1.6) to ensure the interface feels breathable and easy to digest.
- **Labels:** Small caps with tracking (letter spacing) are used for metadata to provide a functional, data-driven aesthetic.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to ensure that "Liquid Glass" panels are centered and balanced, reinforcing the brand's name.
- **Grid:** A 12-column system with wide margins (64px) creates an editorial feel.
- **Rhythm:** All spacing must be multiples of 4px. Use 32px or 48px for section vertical spacing to maintain an airy, open feel.
- **Mobile:** Elements reflow into a single column with 20px side margins, with glass cards spanning the full width of the safe area.

## Elevation & Depth
Depth is not communicated via traditional drop shadows, but through **Backdrop Blurs** and **Luminosity Layers**.
- **Tier 1 (Base):** The dark video background.
- **Tier 2 (Panels):** `.liquid-glass` containers with 40px backdrop-blur and 12% white opacity.
- **Tier 3 (Modals/Popovers):** Higher luminosity (18% white) and a subtle 1px white inner-stroke to simulate light catching the edge of a thick glass pane.
- **The "Masked" Effect:** Use sharp, high-contrast masks on container edges. While the glass is "liquid," the containers are razor-sharp.

## Shapes
Despite the "Liquid" theme, the design system utilizes **Sharp (0px)** corners for all primary containers and buttons. This creates a "Laboratory" or "High-End Tech" vibe that prevents the UI from appearing too soft or "toy-like." The contrast between the organic liquid blurs inside and the rigid, sharp rectangles outside is a signature of this design system.

## Components
- **Buttons:** Sharp-edged, 1px border (`border_luminosity`). Text is uppercase `label-sm`. Hover state fills the button with solid white and flips text to black.
- **Liquid-Glass Cards:** Defined by `backdrop-filter: blur(40px)` and a subtle gradient stroke. Background uses `mix-blend-mode: overlay` for the fill.
- **Inputs:** Minimalist bottom-border only (1px white). Placeholder text is Zinc-400. Focus state triggers a subtle glow behind the input line.
- **Chips:** Small, sharp-edged boxes with 4% white fill. Used for routine tags or data categories.
- **Status Indicators:** Micro-dots using pure white with a "pulse" animation to indicate active routine tracking.
- **Progress Rings:** Ultra-thin (1px) circular strokes with no rounded caps, maintaining the technical precision of the system.