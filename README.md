# MediTrack Industrial

A MERN medicine reminder and adherence tracking course project. The UI uses an industrial control room theme to make medication schedules, dose status, stock, and system alerts easy to scan.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer (local MongoDB or a MongoDB Atlas connection string)
- npm

## Run locally

1. Copy `.env.example` to `server/.env` and set a MongoDB URI and long, unique JWT secrets.
2. From the project root run `npm install` (npm workspaces install the root, API, and UI dependencies).
3. Seed the demo database with `npm run seed`.
4. Start the API and Vite development server with `npm run dev`.
5. Open [http://localhost:5173](http://localhost:5173). The API listens on port 5000; health is at `/api/v1/health` and Swagger docs are at `/api/docs`.

You can also start the API and UI separately with `npm run server` and `npm run client`.

## Demo accounts

All accounts use local seed data. Change these passwords before using a shared or deployed environment.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@meditrack.test` | `Admin123!` |
| Doctor | `maya@meditrack.test` | `Doctor123!` |
| Doctor | `arjun@meditrack.test` | `Doctor123!` |
| Patient | `asha@meditrack.test` | `Patient123!` |
| Patient | `ravi@meditrack.test` | `Patient123!` |
| Patient | `meera@meditrack.test` | `Patient123!` |
| Caregiver | `kiran@meditrack.test` | `Caregiver123!` |

## Implemented

- MongoDB/Mongoose user, medicine catalog, schedule, dose log, and refresh-token models.
- Hashed passwords, short-lived JWT access tokens, rotating refresh tokens, logout, password change, input validation, rate limiting, Helmet, and role middleware.
- Doctor registration approval by admins; patient-to-doctor linking; doctors can list linked patients and prescribe to them.
- Schedule CRUD, pause/resume/complete actions, search and status/form filters, calendar-friendly time slots, medication stock, frequency, and instructions.
- Daily dose queue, taken/skipped/snoozed actions, adherence summary, due-dose scheduler with missed-dose grace period, and Socket.IO reminder events.
- Validated image upload endpoint for JPG/PNG/WEBP files, up to 5 MB, in `server/uploads`.
- Admin overview, user registry, doctor approval, CSV adherence export, responsive React control room, login demo role selector, and elderly-friendly larger controls.
- `npm run test` runs HTTP health, auth validation, and protected schedule API tests.

## API overview

Base path: `/api/v1`. Authenticated endpoints use `Authorization: Bearer <accessToken>`. JSON replies follow `{ success, message, data, meta? }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/change-password` |
| Schedules | `GET/POST /schedules`, `PATCH/DELETE /schedules/:id`, `POST /schedules/:id/action` |
| Doses | `GET /doses`, `POST /doses/:id/action` |
| Reports | `GET /reports/adherence?days=7` |
| Connections | `POST /connections`, `GET /doctors/patients` |
| Catalog | `GET/POST /medicines` (admin write) |
| Admin | `GET /admin/analytics`, `GET /admin/users`, `POST /admin/doctors/:id/approve` |
| Uploads | `POST /uploads` with multipart field `image` |

## Objectives mapping

| Course objective | Evidence in project |
| --- | --- |
| MERN stack | React/Vite UI, Express API, Mongoose models, MongoDB-only persistence |
| CRUD and REST | Schedule and medicine catalog endpoints |
| Authentication/RBAC | JWT middleware, password hashing, admin/doctor/patient/caregiver roles |
| Clear display of project outcomes | Control Room, Dose Cycle, Adherence Report, and Project Info screens |

## Environment

See `.env.example` and `server/.env.example`. Keep secrets out of source control. For a frontend API override, set `VITE_API_URL` in `client/.env` (default `http://localhost:5000/api/v1`).

## Notes

This course-project foundation has working end-to-end flows for the implemented sections above. Larger brief items such as password reset email delivery, full prescription versioning, appointments, vitals, side-effect diary, chat, browser push, PDF reports, and complete translations are not wired into the current app. The upload storage is local disk and can be replaced with a Cloudinary adapter when deploying. Use HTTPS, secure secret management, backups, and a clinical review before any real patient use.
