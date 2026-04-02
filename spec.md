# Rivelo Client — Version 3

## Current State

Rivelo Client is a mobile-first OpenRouter AI client with:
- Auth (multi-profile, localStorage)
- 2 sidebars on desktop: left (chats + model explorer), right (models tab + params tab)
- Chat with streaming SSE, markdown, Q&A interaction panel
- Model explorer with search, favorites, full model card detail
- Settings sheet (profile, API keys, prompts)
- Parameter sliders (temperature, max tokens, top-p, frequency penalty)
- 6 preset system prompts
- Dark theme with teal accent
- Mobile bottom tab bar (Chat / Explore / Params)

## Requested Changes (Diff)

### Add

1. **Code Block Sandbox** — In MessageBubble, every code block gets two buttons: "Copy" and "Run in Sandbox". Run in Sandbox opens a fullscreen/modal iframe sandbox.

2. **In-App Sandbox** — A modal/panel that:
   - Renders HTML files (single `.html` with embedded CSS+JS)
   - Merges multi-file AI responses (when AI gives separate HTML, CSS, JS blocks in one message) into a single runnable document
   - Has a Reload button (rerenders iframe)
   - Has a Publish button that generates a shareable slug-based link (e.g. user picks a name like `myproject`, link is `#sandbox/myproject` stored in localStorage)
   - Inspector mode: user clicks "Inspect" button, then clicks any element in the iframe -> a chip is added to the chat input with just the element type (e.g. `Button`, `Div`, `Input`). The chip shows only the type name, but the actual element's outerHTML is sent to AI when message is submitted.

3. **Chat Input Chips** — Input area supports chips/tags for sandbox elements. Chips show only element type (Button, Div, Input, etc.). When user sends, chips are rendered visibly but the hidden payload (full outerHTML) is appended to the text for AI. AI sees the full code but UI shows just the element type chip.

4. **Resizable + Collapsible Sidebars** — Both left and right sidebars can be:
   - Dragged to resize (drag handle on edge)
   - Collapsed to icon-only strip with a toggle button

5. **Centered Chat Width** — Chat messages area constrained to ~768px max-width, centered (like Google Gemini)

6. **Source Serif 4 Font** — Replace GeneralSans body font with Source Serif 4 from Google Fonts (loaded via @import). Anthropic-style serif look.

7. **New Color Palette** (light pastel + royal blue):
   - Frosted Mint `#DCFCE7` — light backgrounds
   - Royal Blue `#2565F3` — primary accent/brand
   - Powder Blush `#F3A6A6` — secondary accents
   - Lemon Chiffon `#FEF9C3` — highlights
   - Pink Carnation `#F390C1` — tertiary accents
   - Remap OKLCH design tokens to this palette (light theme)

8. **Animated SVGs instead of emojis** — Replace emoji usage in mobile bottom tab bar with animated SVG icons (simple CSS-animated inline SVGs)

9. **Agent Thinking States** — When streaming:
   - Show "Loading..." label while waiting for first chunk
   - Show "Thinking..." label with collapsible thinking block when model sends `<think>...</think>` or before first content arrives
   - Collapsible/expandable thinking block above the main response

10. **Settings Page** — Replace SettingsSheet (slide-over) with a full-page Settings route (`/settings`) with ChatGPT-level settings:
    - Appearance: theme toggle (light/dark), font size, accent color picker
    - Chat: default model, default temperature, max tokens, streaming toggle
    - System Prompts: universal prompt, preset library
    - API Keys: up to 6 keys with failover
    - Profile: username display, switch profiles, logout
    - About: version info
    - All settings functional and persisted in localStorage

### Modify

- `index.css`: Replace dark theme palette with light pastel palette using the provided hex colors mapped to OKLCH. Add Google Fonts import for Source Serif 4. Update font stacks.
- `MessageBubble.tsx`: Add Copy + Run in Sandbox buttons to code blocks.
- `ChatArea.tsx`: Add chip support to composer, centered max-width constraint on messages.
- `MainApp.tsx`: Add resize/collapse logic to both sidebars. Replace Settings button to navigate to Settings page.
- Mobile bottom tab bar: Replace emoji icons with animated SVG components.
- `useChat.ts`: Add thinking state detection (parse `<think>` tags from streaming content).

### Remove
- `SettingsSheet.tsx` (replaced by full Settings page)

## Implementation Plan

1. Update `index.css` — new color palette (OKLCH from hex), Source Serif 4 font import, light theme base
2. Create `SandboxModal.tsx` — iframe sandbox with reload, inspector mode, publish
3. Update `MessageBubble.tsx` — copy button + run in sandbox button on code blocks, thinking block collapsible
4. Update `ChatArea.tsx` — chip support in composer, centered max-width messages
5. Update `useChat.ts` — detect thinking state from `<think>` tags, expose thinkingContent
6. Create `SettingsPage.tsx` — full-page settings with all sections
7. Update `MainApp.tsx` — resizable/collapsible sidebars, route to settings page, remove SettingsSheet
8. Update animated SVG tab icons in mobile bottom bar
9. Update `App.tsx` — route between main app and settings page
