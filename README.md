# Regional Scholarship Application Portal - Frontend

A comprehensive, responsive frontend for managing scholarship applications with role-based access for students and coordinators.

## Features

### Authentication
- Login/Register with JWT authentication
- Password recovery
- Honeypot spam protection in registration
- Protected routes with role-based access control

### Student Features
- **Dashboard**: Overview of application statistics and recent activity
- **Application Form**: Multi-step form with dynamic educational background sections
- **Document Upload**: Drag-and-drop file upload with validation and progress tracking
- **Application Tracking**: View and track application status with timeline

### Coordinator Features
- **Dashboard**: Statistics overview and regional distribution
- **Application Management**: Review, approve, or reject applications with filtering

## Tech Stack

- **React** 18.3.1
- **React Router** 7.13.0
- **Axios** for API calls
- **Context API** for state management
- **Tailwind CSS** 4.1.12
- **Radix UI** components
- **React Hook Form** for form management
- **Sonner** for toast notifications
- **Lucide React** for icons

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── Layout.tsx          # Main layout with navigation
│   │   └── ProtectedRoute.tsx  # Route protection component
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── pages/
│   │   ├── auth/               # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── student/            # Student pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   └── ApplicationTracking.tsx
│   │   ├── coordinator/        # Coordinator pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── ApplicationManagement.tsx
│   │   └── Home.tsx            # Home redirect page
│   ├── utils/
│   │   └── api.ts              # API configuration
│   └── App.tsx                 # Main app with routes
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Development

The Vite dev server is already running. Access the application through the preview surface.

## API Integration

The application expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password recovery

### Student Endpoints
- `GET /api/student/stats` - Dashboard statistics
- `GET /api/student/recent-activity` - Recent activities
- `GET /api/student/applications` - List applications
- `POST /api/student/applications` - Submit application
- `POST /api/student/applications/draft` - Save draft
- `POST /api/student/documents` - Upload document
- `DELETE /api/student/documents/:id` - Delete document

### Coordinator Endpoints
- `GET /api/coordinator/stats` - Dashboard statistics
- `GET /api/coordinator/recent-applications` - Recent applications
- `GET /api/coordinator/applications` - List all applications
- `PATCH /api/coordinator/applications/:id/approve` - Approve application
- `PATCH /api/coordinator/applications/:id/reject` - Reject application

## Security Features

- JWT token storage in localStorage
- Automatic token refresh on API calls
- Protected routes with role-based access
- Honeypot field in registration
- File type and size validation
- XSS prevention through proper input handling
- Automatic logout on token expiration

## UI/UX Features

- Fully responsive design (mobile, tablet, desktop)
- Loading states for all async operations
- Error handling with user-friendly messages
- Toast notifications for user feedback
- Empty states for better UX
- Confirmation dialogs for destructive actions
- Accessible forms with proper labels
- Progress indicators for file uploads
- Status badges and timeline visualization

## Component Library

The project uses shadcn/ui components built on Radix UI primitives:
- Button, Input, Textarea
- Select, Dropdown Menu
- Card, Dialog, Table
- Badge, Progress
- Tabs, Accordion
- And more...

## Best Practices

- Reusable component architecture
- TypeScript interfaces for type safety
- Context API for global state
- Custom hooks for business logic
- Proper error handling
- Clean code organization
- Mobile-first responsive design
- Accessibility considerations

## Future Enhancements

- Real-time notifications
- Advanced filtering and sorting
- Document preview functionality
- Bulk operations for coordinators
- Analytics dashboard
- Export functionality
- Email notifications
- PDF generation for applications

## Production deployment

1. Create a production `.env` from `.env.example` and set secrets.

2. Build and run using docker-compose:

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml build --pull --no-cache
docker compose -f docker-compose.prod.yml up -d
```

3. The frontend will be available on port 80 and the backend on port 8000.

Notes:
- The backend image builds the frontend and copies built static assets into Django's `staticfiles` directory so WhiteNoise can serve them.
- Configure `CLOUDINARY_*` environment variables for media storage in production.

### Deploying on Render

Quick steps to deploy the combined app on Render using the `backend/Dockerfile` (the backend image builds the frontend and serves static files):

1. Create a new **Postgres** database in Render (Managed Service) and note the `DATABASE_URL`.
2. Create a new **Web Service** in Render:
	- Connect your repo and select the `main` branch.
	- Environment: `Docker`.
	- Dockerfile Path: `backend/Dockerfile`.
	- Build Command: leave empty (Dockerfile handles build).
	- Start Command: leave empty (Dockerfile CMD runs Gunicorn).
3. Add environment variables in the Render dashboard for the Web Service (paste values from your `.env` or Render secrets):
	- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG` (set `False`), `DJANGO_ALLOWED_HOSTS` (comma-separated), `CLOUDINARY_*` vars, `DEFAULT_FROM_EMAIL`, etc.
	- `DATABASE_URL` should be copied from the Postgres managed service; Render can also link the DB to the service which injects `DATABASE_URL` automatically.
4. (Optional) Configure a custom domain and enable HTTPS in Render.

Notes and tips:
- Render provides a `$PORT` environment variable; the backend Dockerfile uses `PORT` to bind Gunicorn.
- Ensure `DJANGO_DEBUG=False` in production.
- Use the `DATABASE_URL` provided by Render or set `POSTGRES_*` vars; the app prefers `DATABASE_URL` if present.
- Add any CI secrets (image registry, etc.) if you change the CI workflow to push images.
