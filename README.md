# Campaign UI React

A campaign planning workspace built with React + Vite. It connects to a backend agent that parses a campaign objective, finds audience segments, scores channels, and drafts a full campaign plan.

## Prerequisites

- Node.js 18+
- The backend API running at `http://127.0.0.1:8000`

## Setup

```bash
npm install
```

## Running the app

```bash
npm run dev
```

Opens at `http://localhost:5173`.

The Vite dev server proxies `/campaign` requests to `http://127.0.0.1:8000`, so the backend must be running for campaign generation to work.

## Other commands

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

## Environment

No `.env` file is needed. The backend URL is configured via the Vite proxy in `vite.config.js`.
