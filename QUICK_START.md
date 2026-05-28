# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies (Already Done)
```bash
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. The Application is Ready!
The Vite dev server is already running. Access it through the preview surface.

## First Login

### Student Account
1. Navigate to `/register`
2. Create account with role: "Student"
3. Redirected to student dashboard
4. Explore:
   - Dashboard → View application statistics
   - Apply → Create new application
   - Documents → Upload KYC documents
   - My Applications → Track application status

### Coordinator Account
1. Navigate to `/register`
2. Create account with role: "Coordinator"
3. Redirected to coordinator dashboard
4. Explore:
   - Dashboard → View all statistics
   - Applications → Review and manage applications

## Key Routes

### Public Routes
- `/login` - Sign in
- `/register` - Create account
- `/forgot-password` - Password recovery

### Student Routes (Requires student role)
- `/student/dashboard` - Dashboard overview
- `/student/apply` - Application form
- `/student/documents` - Upload documents
- `/student/applications` - Track applications

### Coordinator Routes (Requires coordinator role)
- `/coordinator/dashboard` - Dashboard overview
- `/coordinator/applications` - Manage all applications

## Testing the Application

### Without Backend

The application is designed to work with a backend API. To test without a backend:

1. **Mock the API responses** in the components
2. **Use a mock API service** like json-server or MSW
3. **Expect 401/404 errors** and error toasts

### With Backend

1. Ensure your backend is running at the API_BASE_URL
2. Backend should implement all endpoints listed in README.md
3. Backend should return JWT tokens on login/register
4. Test the complete flow

## Application Features Demo

### Student Flow
1. **Register** → Create student account
2. **Login** → Access student dashboard
3. **Fill Application** → Multi-step form with personal, contact, and education info
4. **Upload Documents** → Drag-and-drop PDF/images
5. **Track Status** → View application progress

### Coordinator Flow
1. **Register** → Create coordinator account
2. **Login** → Access coordinator dashboard
3. **View Applications** → Filter by region, status, or search
4. **Review Application** → Click "View" to see details
5. **Take Action** → Approve or reject application

## Common Issues

### 1. API Connection Error
**Symptom**: "Network Error" or "Request failed"
**Solution**: 
- Ensure backend is running
- Check VITE_API_BASE_URL in .env
- Verify CORS is enabled on backend

### 2. 401 Unauthorized
**Symptom**: Redirected to login unexpectedly
**Solution**:
- Token may have expired
- Backend may not be accepting the token
- Check token format in backend

### 3. Route Not Working
**Symptom**: Wrong page displays or 404
**Solution**:
- Check user role matches route requirements
- Verify ProtectedRoute is wrapping the route
- Check react-router configuration

### 4. File Upload Fails
**Symptom**: Upload progress shows but fails
**Solution**:
- Check file size < 5MB
- Verify file type is PDF, JPG, or PNG
- Ensure backend accepts multipart/form-data
- Check backend file size limits

## Development Tips

### Hot Module Replacement (HMR)
Vite provides instant HMR. Changes to files will reflect immediately without full reload.

### Debugging
1. Use React DevTools for component inspection
2. Use Network tab to inspect API calls
3. Check Console for errors
4. Use Redux DevTools if you add Redux later

### Component Development
1. All UI components are in `src/app/components/ui/`
2. Use existing components before creating new ones
3. Follow the pattern of existing pages

### State Management
1. Global auth state: `useAuth()` hook
2. Component state: `useState()`
3. Form state: `useForm()` from react-hook-form

## Project Structure Quick Reference

```
src/app/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── Layout.tsx       # Navigation + Footer
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx  # Global auth state
├── pages/
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── student/         # Student pages
│   ├── coordinator/     # Coordinator pages
│   └── Home.tsx
├── utils/
│   └── api.ts           # API client
└── App.tsx              # Routes
```

## Next Steps

1. ✅ Explore the application UI
2. ✅ Test the authentication flow
3. ✅ Fill out an application form
4. ✅ Upload test documents
5. ✅ Review applications as coordinator
6. 📖 Read ARCHITECTURE.md for deeper understanding
7. 🔧 Customize for your specific needs
8. 🚀 Connect to your backend API
9. 🎨 Adjust styling and branding
10. 📦 Deploy to production

## Customization

### Change Branding
- Update logo in `Layout.tsx`
- Change primary color in Tailwind config
- Update title and meta tags

### Add New Features
- Create new page in `src/app/pages/`
- Add route in `App.tsx`
- Update navigation in `Layout.tsx`
- Create API calls in respective page

### Modify Forms
- Edit form fields in page components
- Update validation rules
- Adjust form layout

## Support

For issues, questions, or contributions:
1. Check ARCHITECTURE.md for technical details
2. Review README.md for API documentation
3. Inspect existing code for patterns
4. Follow the established structure

## Summary

You now have a fully functional scholarship application portal frontend with:
- ✅ Authentication (Login, Register, Forgot Password)
- ✅ Role-based access control
- ✅ Student application workflow
- ✅ Coordinator review system
- ✅ Document upload functionality
- ✅ Responsive design
- ✅ Professional UI components

**Start exploring and happy coding!** 🎉
