# Ambient Motion — Full Project Specification

## Project Overview

Create a modern full-stack web application called **ambient motion**.

The application generates atmospheric short-form videos from uploaded photos and preprocessed audio tracks.

This is a personal creative tool inspired by:

- ambient aesthetics
- cinematic visuals
- melancholic mood content
- TikTok / reels visual style
- AI generation dashboards like Midjourney or Suno

The app should feel:

- minimal
- dark
- emotional
- modern
- smooth
- cinematic

The project should prioritize:

- simplicity
- maintainability
- scalability
- clean architecture
- fast MVP development

---

## MONOREPO STRUCTURE

The entire project must use a **single GitHub repository** with npm workspaces.

Use this structure:

```txt
ambient-motion/
├── apps/
│   ├── web/
│   └── api/
├── package.json
├── README.md
└── .gitignore
```

Use:

- npm workspaces
- npm (NOT pnpm)
- shared root dependencies when appropriate

Root package.json:

```json
{
  "private": true,
  "workspaces": [
    "apps/*"
  ]
}
```

---

## FRONTEND STACK

Frontend location:

```txt
/apps/web
```

Use:

- Vue 3
- Vite
- TailwindCSS
- shadcn-vue
- Vue Router
- Pinia
- Axios
- TypeScript

Frontend requirements:

- modern architecture
- reusable components
- responsive design
- dark mode by default
- smooth transitions
- beautiful loading states
- clean typography
- cinematic UI aesthetics

Deploy frontend to:

- Vercel

---

## BACKEND STACK

Backend location:

```txt
/apps/api
```

Use:

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- TypeScript

Backend responsibilities:

- authentication
- file management
- database CRUD
- video generation queue
- Backblaze B2 integration
- AI text generation
- FFmpeg video generation

Deploy backend to:

- Vercel

---

## STORAGE

Use:

- Backblaze B2 (S3-compatible API)

Store:

- assets (photos)
- audio files
- generated videos

Database should store:

- metadata
- URLs
- statuses

Do NOT store files directly in SQLite.

Backblaze B2 is S3-compatible — use `@aws-sdk/client-s3` with custom endpoint.

---

## DATABASE

Use SQLite (via Prisma 6).

Main tables:

### users

- id
- email
- passwordHash
- createdAt

### assets

- id
- filename
- url
- size
- uploadedAt
- userId

### audios

- id
- title
- duration
- url
- uploadedAt
- userId

### videos

- id
- title
- phrase
- status
- videoUrl
- thumbnailUrl
- createdAt
- userId

---

## AUTHENTICATION

Use:

- JWT auth
- email/password login
- bcrypt password hashing

No OAuth required.

Simple minimal auth flow.

---

## APP PAGES

### 1. Login Page

Minimal clean auth page.

Fields:

- email
- password

Features:

- login
- register
- validation
- error handling

---

### 2. Assets Page

Photo/image asset manager. Route: `/assets`.

Inspired by:

- Yandex Disk
- Google Drive

Features:

- upload multiple photos (drag & drop or file picker)
- list and grid view toggle
- image previews (click to open fullscreen lightbox)
- delete assets with confirmation
- show filename (with extension) and file size

Components:

- AssetUploadDialog: multi-file upload dialog (no X button, no outside-click close)
- AssetLightbox: fullscreen image viewer (reusable, used in explorer and upload dialog)
- AssetsView: main page view

---

### 3. Audio Page

Audio library manager.

Features:

- **Upload audio** — upload new preprocessed tracks via drag-drop or file picker
- **Edit metadata** — change title and artist, update cover art
- **Delete audio** — remove tracks with confirmation dialog
- **Audio player** — inline preview with play/pause button on hover
- **View modes** — toggle between list and grid layouts
- **Cover art** — display or upload cover images for each track
- **Metadata display** — show title and artist information

UI Components:

- View toggle buttons (list/grid)
- Upload button in header
- Loading skeletons during fetch
- Empty state when no tracks
- List view: compact rows with hover actions (edit, delete)
- Grid view: square cards in responsive grid with hover actions
- AudioFormDialog: modal for upload/edit with drag-drop zones
- AlertDialog: delete confirmation prompt
- Audio player: integrated playback control

Important:

Uploaded audio files are already preprocessed:

- already trimmed to exact duration
- already contain fade in/out
- ready for direct use in video generation

---

### 4. Create Page

Main video generation interface.

Contains:

#### Audio Selection

User can:

- upload new audio
OR
- select existing audio

---

#### Asset Source Selection

Multi-select assets.

Options:

- all assets
- specific assets

---

#### Generation Settings

Fields:

- mood
- theme
- number of videos

---

#### Phrase Generation

User clicks:

```txt
Generate Phrases
```

System behavior:

- AI generates approximately 2x more phrases than requested
- show generated phrase cards
- user manually accepts/rejects phrases
- user can regenerate more phrases
- accepted phrases remain selected

Phrase requirements:

- 4–7 words
- lowercase preferred
- melancholic
- atmospheric
- emotionally cinematic

Examples:

- "nothing feels the same now"
- "i still wait sometimes"
- "everything faded too quietly"

---

#### Video Generation

After selecting phrases:

User clicks:

```txt
Generate Videos
```

System should:

- create generation tasks
- queue generation in background
- show progress immediately

Generation should continue asynchronously.

---

### 5. Videos Page

Modern AI-style generation dashboard.

Show:

- queued videos
- generating videos
- completed videos
- failed videos

Features:

- preview videos
- download videos
- delete videos
- progress states
- loading indicators

Statuses:

- queued
- generating
- completed
- failed

---

## VIDEO GENERATION SYSTEM

Use:

- FFmpeg
- ffmpeg.wasm OR backend FFmpeg execution

DO NOT use AI video generation.

Videos are generated programmatically.

---

## VIDEO STYLE

Each generated video should:

- be square format (1:1)
- use one centered image
- auto-crop image
- contain top white text bar
- contain melancholic text phrase
- include subtle grain/noise effect
- combine with uploaded audio
- export as MP4

Style should feel:

- cinematic
- emotional
- ambient
- melancholic
- aesthetic

Inspired by:

- demotivator layouts
- ambient TikTok edits
- slow visual loops

---

## VIDEO GENERATION PIPELINE

1. Select random image
2. Crop image center
3. Create square composition
4. Add white top text bar
5. Render phrase text
6. Add subtle grain/noise
7. Combine with audio
8. Export MP4
9. Upload to Cloudflare R2
10. Save metadata to PostgreSQL

---

## AI INTEGRATION

Use OpenAI-compatible API.

AI responsibilities:

- generate atmospheric phrases
- generate melancholic captions
- follow mood/theme instructions

---

## UI DESIGN SYSTEM

The application should use:

- dark UI
- minimalism
- soft gradients
- zinc/gray palette
- smooth animations
- rounded corners
- subtle borders
- cinematic spacing

Preferred colors:

- black
- zinc
- white
- gray

Accent:

- soft blue
OR
- soft violet

Avoid:

- bright colors
- corporate UI
- cluttered layouts

---

## IMPORTANT DEVELOPMENT RULES

- clean architecture
- reusable components
- environment variables
- proper API separation
- loading states everywhere
- robust error handling
- scalable structure
- readable code
- TypeScript where possible

### Code Comments

**Do NOT write comments in code.** Use only when the WHY is non-obvious (hidden constraints, workarounds for specific bugs, subtle invariants). Well-named identifiers and functions should explain WHAT the code does.

Avoid:
- Comments explaining WHAT the code does (the code itself should be clear)
- Section comments like `// Middleware`, `// Routes`
- Step-by-step process comments (except for non-obvious algorithms)
- Comments about what will be implemented later

### Git Commit Messages

Format: `<type>: <description>` (one line, lowercase except for proper nouns/codes)

Types:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring (no functional change)
- `docs:` documentation updates
- `chore:` build, deps, config changes
- `perf:` performance improvements

Examples:
- `feat: batch video generation with single github actions run`
- `fix: exclude node_modules from vercel deployment`
- `refactor: simplify video dispatch logic`

**Do NOT include:**
- Author attribution (e.g., "Co-Authored-By: Claude...")
- Multi-line messages (keep to one line)
- Commit bodies unless absolutely necessary

---

## DEPLOYMENT

Frontend:

- Vercel

Backend:

- Vercel

Storage:

- Backblaze B2

Database:

- PostgreSQL

---

## FINAL GOAL

Build a modern cinematic ambient video generation platform that automatically creates emotional short-form videos from photos and music with a smooth AI-assisted workflow.
