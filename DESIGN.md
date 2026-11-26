---
version: alpha
name: "design-assembly"
description: "The design system of design-assembly, written from the design ledgers at 9428b4c448e6. Do not change it here: change a ledger, then write it again with make design-exports."
colors:
  accent: "#f5f5f5"
  accent-foreground: "#171717"
  background: "#ffffff"
  border: "#e5e5e5"
  card: "#ffffff"
  card-foreground: "#0a0a0a"
  chart-1: "#d4d4d4"
  chart-2: "#737373"
  chart-3: "#525252"
  chart-4: "#404040"
  chart-5: "#262626"
  destructive: "#b3000b"
  foreground: "#0a0a0a"
  input: "#e5e5e5"
  muted: "#f5f5f5"
  muted-foreground: "#707070"
  popover: "#ffffff"
  popover-foreground: "#0a0a0a"
  primary: "#0246ff"
  primary-foreground: "#fafafa"
  ring: "#0246ff"
  secondary: "#f5f5f5"
  secondary-foreground: "#171717"
  sidebar: "#fafafa"
  sidebar-accent: "#f5f5f5"
  sidebar-accent-foreground: "#171717"
  sidebar-border: "#e5e5e5"
  sidebar-foreground: "#0a0a0a"
  sidebar-primary: "{colors.primary}"
  sidebar-primary-foreground: "{colors.primary-foreground}"
  sidebar-ring: "{colors.ring}"
  dark:
    accent: "#262626"
    accent-foreground: "#fafafa"
    background: "#0a0a0a"
    border: "#ffffff1a"
    card: "#171717"
    card-foreground: "#fafafa"
    chart-1: "#d4d4d4"
    chart-2: "#737373"
    chart-3: "#525252"
    chart-4: "#404040"
    chart-5: "#262626"
    destructive: "#ff6467"
    foreground: "#fafafa"
    input: "#ffffff26"
    muted: "#262626"
    muted-foreground: "#a1a1a1"
    popover: "#171717"
    popover-foreground: "#fafafa"
    primary: "#3d77ff"
    primary-foreground: "#171717"
    ring: "#3d77ff"
    secondary: "#262626"
    secondary-foreground: "#fafafa"
    sidebar: "#171717"
    sidebar-accent: "#262626"
    sidebar-accent-foreground: "#fafafa"
    sidebar-border: "#ffffff1a"
    sidebar-foreground: "#fafafa"
    sidebar-primary: "{colors.dark.primary}"
    sidebar-primary-foreground: "{colors.dark.primary-foreground}"
    sidebar-ring: "{colors.dark.ring}"
typography:
  xs:
    fontFamily: "Geist Variable"
    fontSize: 12px
  sm:
    fontFamily: "Geist Variable"
    fontSize: 14px
  base:
    fontFamily: "Geist Variable"
    fontSize: 16px
  lg:
    fontFamily: "Geist Variable"
    fontSize: 18px
  xl:
    fontFamily: "Geist Variable"
    fontSize: 20px
  2xl:
    fontFamily: "Geist Variable"
    fontSize: 24px
  3xl:
    fontFamily: "Geist Variable"
    fontSize: 30px
  4xl:
    fontFamily: "Geist Variable"
    fontSize: 36px
  5xl:
    fontFamily: "Geist Variable"
    fontSize: 48px
rounded:
  base: 10px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  2xl: 18px
  3xl: 22px
  4xl: 26px
spacing:
  unit: "4px"
---

## Overview

The design system of design-assembly, as its design ledgers hold it at 9428b4c448e6. Product type: application; conformance level: AA.

## Colors

Each role is written light at the top and dark under `dark`. A role that follows another is written as a reference to it, so a change to the one reaches the other.

- `sidebar-primary` follows `primary`
- `sidebar-primary-foreground` follows `primary-foreground`
- `sidebar-ring` follows `ring`

## Typography

Running text is set in Geist Variable, headings in Geist Variable. The scale is standard.

## Layout

Every distance is a multiple of the spacing unit, 4px.

## Shapes

The base corner radius is 10px; the other steps derive from it.

## Do's and Don'ts

- Do take every colour, size and corner from these tokens.
- Don't write a value these tokens do not hold: ask the owner of the ledgers for a decision.
