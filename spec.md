# Rivelo Client - OpenRouter Client App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add

**Mobile-First Layout**
- Primary design target is mobile (375px+). Desktop is an enhancement.
- On mobile: single-panel view with bottom navigation tabs (Chat, Models, Settings)
- Sidebar panels slide in as drawers on mobile
- Touch-friendly tap targets, swipe gestures for drawer open/close
- Bottom composer bar pinned above mobile keyboard
- On desktop: three-panel layout (left sidebar, center chat, right inspector)

**Authentication (Local only)**
- Username + password signup/login stored in localStorage
- Multiple user profiles support per browser
- Profile switcher in header
- Each profile stores: username, hashed password (bcrypt-lite or SHA-256), API keys, settings, favorites, chat history refs

**API Key Management**
- Settings panel with up to 6 OpenRouter API key slots
- Each key can be named/labeled
- Multi-key failover: if key returns 429/402/credit error, auto-switch to next key
- Toast notification: "Switched to Key 2 — Key 1 exhausted"
- Keys stored in localStorage per user profile

**Model Explorer — Full OpenRouter Details**
- Fetches from OpenRouter `/api/v1/models` — ALL available fields per model:
  - `id`, `name`, `description`
  - `context_length`
  - `pricing.prompt`, `pricing.completion`, `pricing.image`, `pricing.request`
  - `top_provider.context_length`, `top_provider.max_completion_tokens`
  - `architecture.modality`, `architecture.tokenizer`, `architecture.instruct_type`
  - `per_request_limits` (if available)
  - Any capability tags (vision, function calling, etc.) inferred from modality/description
- Model card UI shows ALL these details in a structured card:
  - Model name + provider badge
  - Description
  - Context window, max completion tokens
  - Input/output pricing per million tokens
  - Architecture: modality (text/image/multimodal), tokenizer, instruct type
  - Capabilities badges: "Vision", "Function Calling", "Code", etc. parsed from description/modality
  - Free tier badge if pricing is 0
- Search + filter by provider, modality, context size
- **Favorites**: star icon on every model card. Favorited models appear in a pinned "Favorites" section at top of model list. Persisted in localStorage per profile.

**Chat Interface**
- Multi-chat with IndexedDB persistence (chats + messages tables)
- Auto-generated chat titles from first message
- **Full Markdown rendering**:
  - Headings (h1-h6)
  - Bold, italic, strikethrough
  - Ordered and unordered lists (nested)
  - Tables (full markdown table rendering with borders/striping)
  - Code blocks with syntax highlighting (language-specific)
  - Inline code
  - Blockquotes
  - Horizontal rules
  - Links (open in new tab)
- Streaming SSE responses from OpenRouter
- **Question/Answer interaction area**: When the model asks the user a structured question (detected via heuristics or explicit model formatting), a dedicated Q&A panel appears above the input bar. This panel shows the model's question prominently with a focused text input or choice buttons for the user to respond — similar to Claude's clarification UI. The hardcoded identity prompt instructs the model to use a specific format (e.g. `[QUESTION]: ...`) when asking questions so the frontend can detect and render it.

**System Prompt Architecture**
1. **JS-baked identity prompt** (~500-600 words, hardcoded): Tells the model:
   - It is the "Rivelo Client AI Assistant"
   - The full app layout (mobile bottom nav, desktop three-panel)
   - Every button and panel: New Chat button, Model Explorer tab, Settings tab, Favorites section, API key slots, system prompt areas, the Q&A interaction area, markdown rendering support
   - It supports full markdown including tables and lists
   - How to trigger the Q&A panel: use format `[QUESTION]: <your question here>` on its own line
   - It knows about multi-key failover, favorites, pre-built prompts
   - Always active, prepended first to every API call
2. **Universal system prompt**: User-editable in Settings. Applied to all chats. Stored in localStorage per profile.
3. **Per-chat system prompt**: Editable inline above the chat composer. If set, overrides universal for that chat. Identity prompt still applies.

**Pre-built Prompt Library** (6 prompts, 500-600 words each):
- Software Engineer / Developer
- UI/UX Designer
- Data Scientist / Analyst
- Product Manager
- Creative Writer
- General Assistant
Accessible from a "Prompts" button. User can apply any as universal or per-chat system prompt.

**UI/UX**
- Dark theme: deep navy/charcoal (#0B0F14), cards at #141A22, teal accent #24C6C8
- Mobile-first: bottom tab bar, drawer sidebars, responsive composer
- Lucide-react icons throughout
- Toast notifications for key failover and other events
- Model parameter sliders in right panel / settings sheet: Temperature, Max Tokens, Top P, Frequency Penalty

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan

1. IndexedDB wrapper (chats, messages)
2. LocalStorage auth + multi-profile manager
3. API key store + failover rotation logic
4. OpenRouter model fetcher (all fields) + model card component with full details
5. Model search/filter + favorites system
6. Streaming chat engine (SSE) with markdown renderer (react-markdown + remark-gfm + rehype-highlight)
7. Q&A interaction panel (detect `[QUESTION]:` tag in model output, render focused answer UI)
8. System prompt layers: identity (hardcoded) + universal (settings) + per-chat (inline)
9. Pre-built prompt library (6 prompts)
10. Mobile-first layout: bottom nav, drawer sidebars, responsive three-panel desktop
11. Settings panel: keys, universal prompt, profile management, model parameters
12. Toast notification system for failover events
