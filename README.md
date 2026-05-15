# DevHub

DevHub is a full-stack developer social platform for profiles, project showcases, technical blogs, and discovery search.

## Features

- Signup, login, logout, protected routes, password hashing, JWT access and refresh tokens in HttpOnly cookies
- Developer profiles with avatar/banner upload, bio, skills, location, social links, portfolio links, public profile pages, and open-to-work filters
- Project showcase with create/read/update/delete, cover image, gallery images, tech stack tags, GitHub/live links, owner-only controls, detail pages, search/filter/sort
- Technical blogs with drafts, publishing, editing, deletion, cover upload, tags/categories, markdown rendering, public slug detail pages, and private draft dashboard
- Discovery tabs for developers, projects, and blogs with debounced one-letter partial search

## Tech Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, RTK Query, React Router, shadcn-style dark UI primitives
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, cookie-parser, Multer memory uploads, ImageKit
- Deployment targets: Vercel/Netlify for frontend, Render/Railway for backend, MongoDB Atlas, ImageKit

## Folder Structure

```text
client/   React + Vite frontend
server/   Express + MongoDB REST API
```

## Environment Variables

Backend `server/.env`:

```env
PORT=3000
MONGO_URI=
JWT_ACCESS_TOKEN=
JWT_REFRESH_TOKEN=
NODE_ENV=development
CLIENT_URL=http://localhost:5173
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

Frontend `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Local Setup

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Backend health check:

```bash
curl http://localhost:3000/api/health
```

## API Routes

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh-token`, `POST /api/auth/logout`
- Profiles: `POST /api/profiles`, `GET /api/profiles/me`, `PATCH /api/profiles/me`, `GET /api/profiles`, `GET /api/profiles/:userId`
- Projects: `POST /api/projects`, `GET /api/projects`, `GET /api/projects/my`, `GET /api/projects/:id`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- Blogs: `POST /api/blogs`, `GET /api/blogs`, `GET /api/blogs/my`, `GET /api/blogs/:idOrSlug`, `PATCH /api/blogs/:id`, `DELETE /api/blogs/:id`

Search uses escaped MongoDB regex partial matching, so one-letter searches such as `?search=r`, `?tech=r`, `?skill=r`, `?tag=r`, and `?category=full` work.

## Database Schema Overview

- User: name, email, hashed password, refresh token, role, active flag
- Profile: user ref, headline, bio, avatar/banner URLs and file ids, skills, GitHub username, location, social links, portfolio showcase, open-to-work, visibility
- Project: owner ref, title, slug, descriptions, tech stack, links, cover/gallery URLs and file ids, category, status, views, likes, featured flag
- Blog: author ref, title, slug, excerpt, content, format, cover URL/file id, tags, category, status, read time, views, likes, featured flag, published date

## ImageKit Setup

Create an ImageKit account, copy public key, private key, and URL endpoint into `server/.env`. Uploads accept jpg, jpeg, png, and webp only, with a 5MB file limit.

## Deployment

Backend on Render/Railway:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Set `MONGO_URI`, JWT secrets, ImageKit variables, `NODE_ENV=production`, and `CLIENT_URL` to the deployed frontend origin.

Frontend on Vercel/Netlify:

- Root directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL=https://your-backend-domain.com/api`

## Live Links

- Frontend: `TBD`
- Backend: `TBD`

## Demo Checklist

1. Clear browser site data.
2. Register, then login.
3. Create a profile with avatar/banner.
4. Create a project with images.
5. Search projects with one letter.
6. Create a blog as draft, verify it appears in My Blogs, then publish it.
7. Open the published blog by slug.
8. Logout, refresh, and verify no repeated auth refresh loop.
