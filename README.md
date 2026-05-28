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
