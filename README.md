# Graph API — SIT Full Stack Engineering Challenge

A Next.js app with a REST API and interactive frontend for processing hierarchical graph relationships.

## Features

- `POST /api/graph` — Validates edges, builds trees, detects cycles, returns structured JSON
- Interactive frontend with collapsible tree visualizer, summary stats, and raw JSON view

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Usage

```bash
curl -X POST http://localhost:3000/api/graph \
  -H "Content-Type: application/json" \
  -d '{"edges": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]}'
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or use Railway / Render — just push to GitHub and connect.

## Stack

- **Next.js** (Pages Router)
- **Vanilla CSS** (no Tailwind / component library)
- **Zero external runtime dependencies**
