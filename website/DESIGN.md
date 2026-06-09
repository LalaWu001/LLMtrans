---
name: Midnight Flora
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c5c5d3'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#8f909d'
  outline-variant: '#444651'
  surface-tint: '#b6c4ff'
  primary: '#b6c4ff'
  on-primary: '#05297a'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#4059aa'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#364154'
  on-tertiary-container: '#a2adc4'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Poppins
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Poppins
    fontSize: 30px
    fontWeight: '500'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system evolves from a sterile grayscale into a deep, immersive organic experience. It targets high-end wellness, creative portfolios, and premium lifestyle platforms that require a sense of mystery, depth, and nocturnal elegance.

The design style is a hybrid of **Glassmorphism** and **Minimalism**. It utilizes "Luminous Glass"—translucent layers that appear to float over deep navy voids, catching light through subtle blue tints and backdrop blurs. The aesthetic should feel like moonlight filtering through a dark garden: calm, sophisticated, and technologically advanced yet biologically inspired.

## Colors
The palette is rooted in the depth of the night. The core is a duo of **Midnight Navy** (#020617) for deep backgrounds and **Surface Navy** (#0F172A) for elevated containers. 

**Primary Blue** (#1E3A8A) acts as the anchor for action elements, while **Electric Sky** (#38BDF8) is used sparingly for high-contrast highlights, active states, and focus indicators. All text follows a hierarchy of high-contrast off-whites and muted blue-greys to ensure legibility against the dark canvases without causing eye strain.

## Typography
The typographic strategy creates a tension between the geometric modernism of **Poppins** and the literary, organic warmth of **Source Serif 4**. 

- **Headlines & UI Labels:** Use Poppins. Its geometric clarity provides a structured, modern frame for the interface.
- **Body & Editorial Content:** Use Source Serif 4. The serif's "flora" qualities—its subtle curves and high readability—bring a human, tactile touch to the midnight theme.
- **Scaling:** Use tighter tracking for large display headers and increased letter spacing for small caps labels to maintain a premium feel.

## Layout & Spacing
The layout philosophy is **Fluid with Generous Margins**. Content should never feel cramped; white space (or "navy space") is treated as a premium design element to allow the flora-inspired typography to breathe.

- **Grid:** A 12-column system on desktop with wide 24px gutters.
- **Rhythm:** An 8px base unit drives all padding and margins. 
- **Adaptation:** On mobile, margins shrink to 16px, and vertical spacing between glass cards increases to maintain a clear visual hierarchy in a stacked view.

## Elevation & Depth
Depth is created through **Luminous Glassmorphism** rather than traditional drop shadows.

- **Backdrop Blur:** Use a `20px` to `40px` blur on container backgrounds.
- **Luminosity Blend:** Glass layers should use a `Luminosity` or `Overlay` blend mode with a 10-15% opacity blue-tinted fill (#38BDF8 at 10% opacity).
- **Inner Borders:** High-elevation elements feature a 1px top border (a "rim light") with a 20% white opacity to simulate light catching the top edge of the glass.
- **Shadows:** When used, shadows are highly diffused and tinted with the primary blue (#1E3A8A) at very low opacity (5-10%) to avoid a "muddy" look on the dark background.

## Shapes
Shapes are defined by soft, organic radii that mirror the natural world. 

- **Base Radius:** 0.5rem (8px) for inputs and smaller components.
- **Large Radius:** 1rem (16px) for cards and modals, creating a soft, approachable container for content.
- **Pill Shapes:** Reserved exclusively for tags, chips, and secondary buttons to differentiate them from the primary structural cards.

## Components
Consistent execution of the Midnight Flora theme across the component library:

- **Buttons:** Primary buttons use a solid #1E3A8A fill with off-white text. Secondary buttons use a glass-effect background with a 1px border in #38BDF8.
- **Cards:** The signature component. High backdrop blur, 10% blue tint, and a 1px subtle stroke. No heavy shadows; the depth is conveyed through the blur.
- **Inputs:** Darker than the surface (#020617) with a subtle bottom-only border that glows #38BDF8 upon focus.
- **Chips:** Fully rounded (pill) with a low-opacity primary blue fill and Poppins labels in uppercase.
- **Lists:** Separated by thin, 5% opacity white dividers. Active list items receive a subtle blue gradient glow from the left edge.
- **Flora Accents:** Use large, low-opacity organic SVG shapes or blurred gradients in the background to provide "blooms" of light behind the glass components.