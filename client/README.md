# DevHub Frontend

Premium React + TypeScript frontend for the DevHub developer social platform.

## Stack

- React + TypeScript + Vite
- Redux Toolkit + RTK Query
- React Router DOM
- Tailwind CSS
- Framer Motion
- React Hook Form + Zod
- Lucide React
- Sonner
- React Markdown

## Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Set the backend URL:

```env
VITE_API_BASE_URL=https://hacksprint-1-kodex1-0.onrender.com/api
```

## Build

```bash
npm run build
```

## Architecture

- `src/app` global app, store, router, providers
- `src/pages` route-level pages
- `src/features` auth/profile/projects/blogs/search schemas and feature types
- `src/services/api` RTK Query API layer
- `src/shared` reusable UI, layouts, utilities, and types

## API Integration

The RTK Query base API uses `credentials: "include"` for HttpOnly cookie auth and retries once through `/auth/refresh-token` after a `401`.

## Deployment

Deploy to Vercel or Netlify and set:

```env
VITE_API_BASE_URL=https://hacksprint-1-kodex1-0.onrender.com/api
```
