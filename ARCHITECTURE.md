# Regional Scholarship Portal - Architecture Documentation

## Overview

This is a React-based single-page application (SPA) for managing scholarship applications with role-based access control for students and coordinators.

## Architecture Patterns

### 1. Context API for State Management

**AuthContext** (`src/app/contexts/AuthContext.tsx`)
- Manages authentication state globally
- Handles login, register, logout operations
- Stores user information and JWT token
- Provides authentication utilities to all components

### 2. Protected Routes

**ProtectedRoute** (`src/app/components/ProtectedRoute.tsx`)
- Wraps protected pages to enforce authentication
- Supports role-based access control
- Redirects unauthenticated users to login
- Shows loading state during auth check

### 3. API Layer

**API Client** (`src/app/utils/api.ts`)
- Centralized Axios instance with base configuration
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles 401 errors and auto-logout
- Error handling utilities

### 4. Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── BrowserRouter
│       └── Routes
│           ├── Public Routes (Login, Register, ForgotPassword)
│           └── Protected Routes
│               └── Layout (Navigation + Footer)
│                   └── Page Components
```

## Folder Structure

```
src/app/
├── components/
│   ├── ui/                      # Shadcn/UI components (Radix UI based)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── Layout.tsx               # Main layout with navigation
│   └── ProtectedRoute.tsx       # Route protection wrapper
│
├── contexts/
│   └── AuthContext.tsx          # Authentication context
│
├── pages/
│   ├── auth/
│   │   ├── Login.tsx            # Login page
│   │   ├── Register.tsx         # Registration page with honeypot
│   │   └── ForgotPassword.tsx   # Password recovery
│   │
│   ├── student/
│   │   ├── Dashboard.tsx        # Student dashboard with stats
│   │   ├── ApplicationForm.tsx  # Multi-step application form
│   │   ├── DocumentUpload.tsx   # Document upload with drag-drop
│   │   └── ApplicationTracking.tsx  # Application status tracking
│   │
│   ├── coordinator/
│   │   ├── Dashboard.tsx        # Coordinator dashboard
│   │   └── ApplicationManagement.tsx  # Review applications
│   │
│   └── Home.tsx                 # Role-based redirect
│
├── utils/
│   └── api.ts                   # API client and error handling
│
└── App.tsx                      # Main app with routes
```

## Key Features Implementation

### 1. Authentication Flow

```typescript
// Login Process
1. User enters credentials
2. Login component calls AuthContext.login()
3. AuthContext makes API call to /api/auth/login
4. On success: Store token and user in localStorage
5. Set Authorization header in Axios defaults
6. Update context state
7. Redirect to dashboard

// Protected Route Access
1. User navigates to protected route
2. ProtectedRoute checks if user exists in context
3. If no user: redirect to /login
4. If user but wrong role: redirect to /
5. If authorized: render child component

// Token Expiration
1. API returns 401 status
2. Axios interceptor catches error
3. Clear localStorage and context
4. Redirect to /login
```

### 2. Form Management

**Application Form** uses React Hook Form:
- Multi-step form with tabs
- Dynamic field arrays for educational background
- Built-in validation with error display
- Draft save functionality
- Form state persistence

```typescript
const { register, control, handleSubmit, formState: { errors } } = useForm();
const { fields, append, remove } = useFieldArray({ control, name: 'educationalBackground' });
```

### 3. File Upload

**Document Upload** features:
- Drag-and-drop interface
- File validation (type, size)
- Upload progress tracking
- Preview of uploaded documents
- Delete functionality

```typescript
// Validation
const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return 'File too large';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid type';
  return null;
};

// Upload with progress
api.post('/student/documents', formData, {
  onUploadProgress: (progressEvent) => {
    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(progress);
  },
});
```

### 4. Role-Based Navigation

The Layout component dynamically shows navigation based on user role:

```typescript
const studentNavItems = [
  { path: '/student/dashboard', label: 'Dashboard', icon: Home },
  { path: '/student/apply', label: 'Apply', icon: FileText },
  { path: '/student/documents', label: 'Documents', icon: Upload },
  { path: '/student/applications', label: 'My Applications', icon: CheckCircle },
];

const coordinatorNavItems = [
  { path: '/coordinator/dashboard', label: 'Dashboard', icon: Home },
  { path: '/coordinator/applications', label: 'Applications', icon: FileText },
];

const navItems = user?.role === 'coordinator' ? coordinatorNavItems : studentNavItems;
```

## Data Flow

### Student Application Submission

```
1. Student fills ApplicationForm
   └─> Form state managed by React Hook Form
2. On submit: POST /api/student/applications
   └─> API interceptor adds JWT token
3. Success response
   └─> Toast notification shown
   └─> Navigate to /student/applications
4. Error response
   └─> Error toast shown
   └─> Form remains for correction
```

### Coordinator Application Review

```
1. Load applications: GET /api/coordinator/applications
2. Display in table with filters
3. Click "View" on application
   └─> Open dialog with details
4. Click "Approve" or "Reject"
   └─> PATCH /api/coordinator/applications/:id/approve or /reject
5. Update local state
   └─> No need to refetch
6. Show success toast
```

## Security Considerations

### 1. JWT Token Management
- Stored in localStorage (consider httpOnly cookies for production)
- Automatically included in all API requests
- Removed on logout or 401 error
- Never exposed in URLs

### 2. Route Protection
- All sensitive routes wrapped in ProtectedRoute
- Role-based access control enforced
- Unauthorized access redirects safely

### 3. Input Validation
- Client-side validation for UX
- Server-side validation expected
- Honeypot field in registration
- File type and size validation

### 4. XSS Prevention
- React's built-in escaping
- No dangerouslySetInnerHTML usage
- Proper input sanitization

## Performance Optimizations

1. **Code Splitting**: React Router based splitting
2. **Lazy Loading**: Components loaded on demand
3. **Memoization**: React.memo for expensive components
4. **Debouncing**: Search inputs debounced
5. **Pagination**: Large lists should be paginated (future)

## Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops)
- `xl`: 1280px (large desktops)

### Mobile Navigation
- Hamburger menu below md breakpoint
- Collapsible navigation drawer
- Touch-friendly button sizes
- Optimized layouts for small screens

## Error Handling

### Levels of Error Handling

1. **Component Level**
   - Try-catch blocks in async functions
   - Error state management
   - User-friendly error messages

2. **API Level**
   - Axios interceptors for global errors
   - 401: Auto-logout
   - Network errors: Show offline message
   - Validation errors: Display field-specific errors

3. **Route Level**
   - 404 catch-all route
   - Unauthorized access redirects
   - Loading states during auth check

## Testing Strategy (Recommended)

### Unit Tests
- Utility functions (api.ts)
- Context providers
- Custom hooks

### Integration Tests
- Form submissions
- Authentication flow
- Protected route access

### E2E Tests
- Complete user workflows
- Student application process
- Coordinator review process

## Deployment Considerations

1. **Environment Variables**
   - API base URL
   - Any feature flags
   - Analytics keys

2. **Build Optimization**
   - Production build with `vite build`
   - Asset optimization
   - Bundle size analysis

3. **Security Headers**
   - CSP (Content Security Policy)
   - HSTS
   - X-Frame-Options

4. **Monitoring**
   - Error tracking (Sentry, etc.)
   - Analytics (Google Analytics, etc.)
   - Performance monitoring

## API Contract

See README.md for complete API endpoint documentation.

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live notifications
2. **Advanced Search**: Elasticsearch integration
3. **Analytics Dashboard**: Charts and graphs for coordinators
4. **Bulk Operations**: Batch approve/reject applications
5. **Document Preview**: In-app PDF/image viewer
6. **Email Notifications**: Integration with email service
7. **Export Functionality**: CSV/PDF exports
8. **Offline Support**: PWA with service workers
9. **Multi-language**: i18n support
10. **Dark Mode**: Theme switching

## Contributing Guidelines

1. Follow existing code structure
2. Use TypeScript interfaces for all data
3. Write reusable components
4. Handle all error cases
5. Add loading states
6. Ensure mobile responsiveness
7. Follow accessibility best practices
8. Keep components focused and small
