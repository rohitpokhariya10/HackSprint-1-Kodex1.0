# DevHub Backend

DevHub is a developer social platform backend for creating portfolios, sharing projects, publishing technical blogs, and supporting discovery through search and filters.

## Objective

This backend is built to behave like a production-style API for a hackathon sprint:

- Clean frontend-friendly JSON responses
- JWT auth with HttpOnly cookies
- Developer profiles with avatar/banner uploads
- Project showcase with cover/gallery uploads
- Technical blogs with slug pages and cover uploads
- Search, filters, latest/trending lists, and pagination
- Modular folder structure for team collaboration

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- HttpOnly cookies
- Multer memory uploads
- ImageKit

## Setup

```bash
cd server
npm install
npm run check
npm run dev
```

The API starts on `PORT` from `.env`, or `3000` by default. Use `npm start` for production.

## Environment Variables

Create `server/.env` using `.env.example`:

```env
PORT=3000
MONGO_URI=
JWT_ACCESS_TOKEN=
JWT_REFRESH_TOKEN=
NODE_ENV=development
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
CLIENT_URL=http://localhost:5173
```

Never commit real credentials.

## API Response Shape

Most APIs return:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {}
}
```

Auth responses also keep a `user` key for frontend compatibility, but password and refresh token are removed.

## Health Route

- `GET /api/health`

Expected response:

```json
{
  "success": true,
  "message": "DevHub API is running"
}
```

## Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

Auth uses access and refresh tokens stored in HttpOnly cookies. Protected routes accept cookies or `Authorization: Bearer <token>`.

## Profile Routes

- `POST /api/profiles`
- `GET /api/profiles/me`
- `PATCH /api/profiles/me`
- `GET /api/profiles`
- `GET /api/profiles/:userId`

Query examples:

- `GET /api/profiles?search=mern`
- `GET /api/profiles?search=r`
- `GET /api/profiles?skill=react`
- `GET /api/profiles?skill=r`
- `GET /api/profiles?openToWork=true`

Multipart upload fields:

- `avatar` single image
- `banner` single image

String URL fallback still works for `avatar` and `banner`.

## Project Routes

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/my`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

Query examples:

- `GET /api/projects?search=devhub`
- `GET /api/projects?search=d`
- `GET /api/projects?tech=react`
- `GET /api/projects?tech=r`
- `GET /api/projects?sort=latest`
- `GET /api/projects?sort=trending`
- `GET /api/projects?page=1&limit=5`

Multipart upload fields:

- `coverImage` single image
- `images` up to 5 gallery images

`techStack` supports comma-separated values, repeated fields, arrays, and JSON string arrays.

## Blog Routes

- `POST /api/blogs`
- `GET /api/blogs`
- `GET /api/blogs/my`
- `GET /api/blogs/:idOrSlug`
- `PATCH /api/blogs/:id`
- `DELETE /api/blogs/:id`

Query examples:

- `GET /api/blogs?search=devhub`
- `GET /api/blogs?search=h`
- `GET /api/blogs?tag=react`
- `GET /api/blogs?tag=r`
- `GET /api/blogs?category=full stack`
- `GET /api/blogs?sort=latest`
- `GET /api/blogs?sort=trending`
- `GET /api/blogs/my?status=draft`
- `GET /api/blogs/my?status=published`

Multipart upload fields:

- `coverImage` single image

`tags` supports comma-separated values, repeated fields, arrays, and JSON string arrays.

## ImageKit Uploads

The backend uses `multer.memoryStorage()` and uploads directly to ImageKit.

Allowed image types:

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

Allowed extensions:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

Rejected examples:

- PDF
- TXT
- EXE
- SVG

Maximum file size is `5MB`.

Stored fields:

- Profile: `avatar`, `avatarFileId`, `banner`, `bannerFileId`
- Project: `coverImage`, `coverImageFileId`, `images`, `imageFileIds`
- Blog: `coverImage`, `coverImageFileId`

Clean upload errors:

- `Only image files are allowed`
- `File too large. Maximum size is 5MB`
- `Image upload failed`

## Database Overview

User:

- `name`, `email`, `password`, `refreshToken`, `role`, `isActive`, timestamps
- `password` and `refreshToken` are excluded from normal queries

Profile:

- `user` ref, `headline`, `bio`, avatar/banner fields, `skills`, `githubUsername`, `location`, `socialLinks`, `portfolioShowcase`, `isOpenToWork`, `profileVisibility`
- Text index for profile discovery

Project:

- `owner` ref, `title`, `slug`, `description`, `shortDescription`, `techStack`, links, cover/gallery images, `category`, `status`, `views`, `likesCount`, `isFeatured`
- Text and sorting/filter indexes

Blog:

- `author` ref, `title`, `slug`, `excerpt`, `content`, `contentFormat`, cover image, `tags`, `category`, `status`, `readTime`, `views`, `likesCount`, `isFeatured`, `publishedAt`
- Text and sorting/filter indexes

## Postman Testing Guide

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. Keep cookies enabled in Postman.
4. `GET /api/auth/me`
5. `GET /api/health`
6. `POST /api/auth/logout` twice to verify idempotent logout.
7. Login again before protected profile/project/blog tests.
8. `POST /api/profiles` with JSON URL strings.
9. `POST /api/profiles` with `form-data` avatar/banner files.
10. `PATCH /api/profiles/me`.
11. `GET /api/profiles?search=r`.
12. `GET /api/profiles?skill=r`.
13. `POST /api/projects` with JSON URL strings.
14. `POST /api/projects` with `form-data` cover/gallery files.
15. `GET /api/projects?search=d`.
16. `GET /api/projects?tech=r`.
17. `GET /api/projects?sort=latest`.
18. `GET /api/projects?sort=trending`.
19. `PATCH /api/projects/:id` as owner.
20. `DELETE /api/projects/:id` as owner.
21. `POST /api/blogs` with JSON URL string and `status=draft`.
22. `POST /api/blogs` with `form-data` cover file and `status=published`.
23. `GET /api/blogs?search=h`.
24. `GET /api/blogs?tag=r`.
25. `GET /api/blogs/:idOrSlug`.
26. `GET /api/blogs/my?status=draft`.
27. Upload a PDF to verify rejection.
28. Upload a file over 5MB to verify size rejection.
29. `POST /api/auth/refresh-token`.
30. `POST /api/auth/logout`.
31. Confirm protected routes fail after logout.

## Deployment Notes

Render/Railway setup:

- Build command: `npm install`
- Start command: `npm start`
- Root directory: `server` if deploying from the monorepo
- Health check path: `/api/health`

- Set `NODE_ENV=production`.
- Set `CLIENT_URL` to your deployed frontend origin.
- Set MongoDB Atlas and ImageKit environment variables.
- Ensure cookies are sent with credentials from the frontend.
- Keep ImageKit private key only in server environment variables.

## Live Link

Frontend live link: `TBD`

Backend live link: `TBD`

## Bonus Features Not Included Yet

- Likes/saves persistence
- Comments
- Follow/unfollow
- GitHub API integration
- Realtime chat
