# Application Flow Diagrams

## User Journey Maps

### 1. Student Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Visit Website (/)
  │     │
  │     ├─→ Not Logged In → Redirect to /login
  │     │
  │     └─→ Logged In as Student → /student/dashboard
  │
  ├─→ Register (/register)
  │     │
  │     ├─→ Fill Registration Form
  │     ├─→ Select Role: Student
  │     ├─→ Submit (POST /api/auth/register)
  │     └─→ Auto-login → /student/dashboard
  │
  ├─→ Login (/login)
  │     │
  │     ├─→ Enter Credentials
  │     ├─→ Submit (POST /api/auth/login)
  │     └─→ Success → /student/dashboard
  │
  └─→ Student Dashboard (/student/dashboard)
        │
        ├─→ View Statistics
        │     - Total Applications
        │     - Pending Count
        │     - Approved Count
        │     - Rejected Count
        │
        ├─→ View Recent Activity
        │
        ├─→ Quick Actions
        │     │
        │     ├─→ Start New Application
        │     │     │
        │     │     └─→ Application Form (/student/apply)
        │     │           │
        │     │           ├─→ Step 1: Personal Information
        │     │           │     - First Name, Last Name
        │     │           │     - Date of Birth, Gender
        │     │           │
        │     │           ├─→ Step 2: Contact Information
        │     │           │     - Email, Phone
        │     │           │     - Address, City, Region
        │     │           │
        │     │           ├─→ Step 3: Educational Background
        │     │           │     - School Name, Degree
        │     │           │     - Field of Study, GPA
        │     │           │     - Start Date, End Date
        │     │           │     - Add/Remove Schools
        │     │           │
        │     │           ├─→ Save Draft
        │     │           │     (POST /api/student/applications/draft)
        │     │           │
        │     │           └─→ Submit Application
        │     │                 (POST /api/student/applications)
        │     │                 └─→ Success → /student/applications
        │     │
        │     ├─→ Upload Documents
        │     │     │
        │     │     └─→ Document Upload (/student/documents)
        │     │           │
        │     │           ├─→ Drag & Drop Files
        │     │           │     - Validate Type (PDF, JPG, PNG)
        │     │           │     - Validate Size (< 5MB)
        │     │           │
        │     │           ├─→ Upload with Progress
        │     │           │     (POST /api/student/documents)
        │     │           │
        │     │           └─→ View Uploaded Documents
        │     │                 - Preview
        │     │                 - Delete Option
        │     │
        │     └─→ View Application Status
        │           │
        │           └─→ Application Tracking (/student/applications)
        │                 │
        │                 ├─→ Search Applications
        │                 ├─→ Filter by Status
        │                 ├─→ View Timeline
        │                 │     - Submitted
        │                 │     - Under Review
        │                 │     - Decision (Approved/Rejected)
        │                 │
        │                 └─→ View Application Details
        │
        └─→ Logout
              └─→ Redirect to /login
```

### 2. Coordinator Journey

```
┌─────────────────────────────────────────────────────────────┐
│                  COORDINATOR JOURNEY                        │
└─────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Visit Website (/)
  │     │
  │     ├─→ Not Logged In → Redirect to /login
  │     │
  │     └─→ Logged In as Coordinator → /coordinator/dashboard
  │
  ├─→ Register (/register)
  │     │
  │     ├─→ Fill Registration Form
  │     ├─→ Select Role: Coordinator
  │     ├─→ Submit (POST /api/auth/register)
  │     └─→ Auto-login → /coordinator/dashboard
  │
  ├─→ Login (/login)
  │     │
  │     ├─→ Enter Credentials
  │     ├─→ Submit (POST /api/auth/login)
  │     └─→ Success → /coordinator/dashboard
  │
  └─→ Coordinator Dashboard (/coordinator/dashboard)
        │
        ├─→ View Statistics
        │     - Total Applications
        │     - Pending Review
        │     - Approved Today
        │     - Rejected Today
        │
        ├─→ View Regional Distribution
        │     - Applications by Region
        │
        ├─→ View Recent Applications
        │
        ├─→ Quick Actions
        │     │
        │     └─→ View All Applications
        │           │
        │           └─→ Application Management (/coordinator/applications)
        │                 │
        │                 ├─→ Filter Applications
        │                 │     - Search by Name/Email
        │                 │     - Filter by Region
        │                 │     - Filter by Status
        │                 │
        │                 ├─→ View Application Details (Click View)
        │                 │     │
        │                 │     └─→ Details Modal
        │                 │           │
        │                 │           ├─→ View Applicant Info
        │                 │           │     - Name, Email
        │                 │           │     - Region
        │                 │           │     - Submitted Date
        │                 │           │
        │                 │           ├─→ Review Documents
        │                 │           │     - Click to Open
        │                 │           │     - View in New Tab
        │                 │           │
        │                 │           └─→ Take Action
        │                 │                 │
        │                 │                 ├─→ Approve
        │                 │                 │     (PATCH /api/coordinator/applications/:id/approve)
        │                 │                 │     └─→ Success Toast
        │                 │                 │           └─→ Update Status in Table
        │                 │                 │
        │                 │                 └─→ Reject
        │                 │                       (PATCH /api/coordinator/applications/:id/reject)
        │                 │                       └─→ Success Toast
        │                 │                             └─→ Update Status in Table
        │                 │
        │                 └─→ Table View
        │                       - Sortable Columns
        │                       - Pagination (if implemented)
        │
        └─→ Logout
              └─→ Redirect to /login
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

User Visits Protected Route
  │
  ├─→ ProtectedRoute Component Checks
  │     │
  │     ├─→ Is User Authenticated?
  │     │     │
  │     │     ├─→ NO → Redirect to /login
  │     │     │
  │     │     └─→ YES → Check Role
  │     │               │
  │     │               ├─→ Wrong Role → Redirect to /
  │     │               │
  │     │               └─→ Correct Role → Render Page
  │     │
  │     └─→ Loading State
  │           └─→ Show Spinner
  │
  └─→ User Logs In
        │
        ├─→ Enter Email & Password
        ├─→ Submit Form
        ├─→ POST /api/auth/login
        │     │
        │     ├─→ Success
        │     │     │
        │     │     ├─→ Receive JWT Token
        │     │     ├─→ Receive User Data
        │     │     ├─→ Store Token in localStorage
        │     │     ├─→ Store User in localStorage
        │     │     ├─→ Set Authorization Header
        │     │     ├─→ Update AuthContext
        │     │     └─→ Redirect to Dashboard
        │     │
        │     └─→ Error
        │           └─→ Show Error Message
        │
        └─→ Token Expiration (401 Response)
              │
              ├─→ Axios Interceptor Catches
              ├─→ Clear localStorage
              ├─→ Clear AuthContext
              └─→ Redirect to /login
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW                              │
└─────────────────────────────────────────────────────────────┘

Component Renders
  │
  ├─→ useEffect Hook Triggers
  │     │
  │     └─→ Fetch Data
  │           │
  │           ├─→ Set Loading State (true)
  │           │
  │           ├─→ API Call (via axios)
  │           │     │
  │           │     ├─→ Request Interceptor
  │           │     │     └─→ Add JWT Token to Headers
  │           │     │
  │           │     ├─→ Server Response
  │           │     │
  │           │     └─→ Response Interceptor
  │           │           │
  │           │           ├─→ Success (2xx)
  │           │           │     └─→ Return Data
  │           │           │
  │           │           └─→ Error (4xx, 5xx)
  │           │                 │
  │           │                 ├─→ 401 → Auto Logout
  │           │                 │
  │           │                 └─→ Other → Return Error
  │           │
  │           ├─→ Update Component State
  │           │     │
  │           │     ├─→ Set Data
  │           │     └─→ Set Error (if any)
  │           │
  │           └─→ Set Loading State (false)
  │
  └─→ Component Re-renders
        └─→ Display Data or Error
```

## Form Submission Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   FORM SUBMISSION FLOW                      │
└─────────────────────────────────────────────────────────────┘

User Fills Form
  │
  ├─→ React Hook Form Manages State
  │     │
  │     ├─→ Field Registration
  │     ├─→ Validation Rules
  │     └─→ Error Tracking
  │
  └─→ User Submits Form
        │
        ├─→ onSubmit Handler
        │     │
        │     ├─→ Client-side Validation
        │     │     │
        │     │     ├─→ Invalid → Show Errors
        │     │     │
        │     │     └─→ Valid → Continue
        │     │
        │     ├─→ Set Loading State (true)
        │     │
        │     ├─→ API Call
        │     │     │
        │     │     ├─→ POST Data
        │     │     │
        │     │     ├─→ Success Response
        │     │     │     │
        │     │     │     ├─→ Show Success Toast
        │     │     │     ├─→ Set Loading (false)
        │     │     │     └─→ Navigate to Next Page
        │     │     │
        │     │     └─→ Error Response
        │     │           │
        │     │           ├─→ Show Error Toast
        │     │           ├─→ Set Loading (false)
        │     │           └─→ Keep Form for Correction
        │     │
        │     └─→ Set Loading State (false)
        │
        └─→ Form Reset or Navigate
```

## File Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────┘

User Selects File
  │
  ├─→ Via Drag & Drop
  │     │
  │     ├─→ onDrop Handler
  │     └─→ Extract File from DataTransfer
  │
  └─→ Via File Input
        │
        └─→ onChange Handler
              │
              └─→ Extract File from Input
  │
  ├─→ Validate File
  │     │
  │     ├─→ Check File Size
  │     │     │
  │     │     └─→ > 5MB → Show Error Toast
  │     │
  │     └─→ Check File Type
  │           │
  │           └─→ Not PDF/JPG/PNG → Show Error Toast
  │
  ├─→ Create FormData
  │     └─→ Append File
  │
  ├─→ Upload File
  │     │
  │     ├─→ Set Uploading State (true)
  │     ├─→ Set Progress (0%)
  │     │
  │     ├─→ POST /api/student/documents
  │     │     │
  │     │     ├─→ onUploadProgress
  │     │     │     └─→ Update Progress Bar
  │     │     │
  │     │     ├─→ Success
  │     │     │     │
  │     │     │     ├─→ Add to Documents List
  │     │     │     ├─→ Show Success Toast
  │     │     │     └─→ Reset Progress
  │     │     │
  │     │     └─→ Error
  │     │           │
  │     │           ├─→ Show Error Toast
  │     │           └─→ Reset Progress
  │     │
  │     └─→ Set Uploading State (false)
  │
  └─→ Display Uploaded Document
        └─→ With Preview Card
```

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   NAVIGATION FLOW                           │
└─────────────────────────────────────────────────────────────┘

Layout Component
  │
  ├─→ Top Navigation Bar
  │     │
  │     ├─→ Logo (Click → Home)
  │     │
  │     ├─→ Navigation Links
  │     │     │
  │     │     ├─→ Student Role
  │     │     │     - Dashboard
  │     │     │     - Apply
  │     │     │     - Documents
  │     │     │     - My Applications
  │     │     │
  │     │     └─→ Coordinator Role
  │     │           - Dashboard
  │     │           - Applications
  │     │
  │     └─→ User Menu (Dropdown)
  │           │
  │           ├─→ User Info Display
  │           └─→ Logout Button
  │
  ├─→ Mobile Menu (< md breakpoint)
  │     │
  │     └─→ Hamburger Icon
  │           │
  │           └─→ Toggle Menu
  │                 └─→ Show Navigation Links
  │
  ├─→ Main Content Area
  │     └─→ {children} (Current Page)
  │
  └─→ Footer
        └─→ Copyright Info
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT                           │
└─────────────────────────────────────────────────────────────┘

Global State (Context API)
  │
  └─→ AuthContext
        │
        ├─→ user (User | null)
        ├─→ token (string | null)
        ├─→ isLoading (boolean)
        │
        ├─→ login(email, password)
        ├─→ register(data)
        └─→ logout()

Local State (Component)
  │
  ├─→ Data State
  │     - applications[]
  │     - documents[]
  │     - stats{}
  │
  ├─→ UI State
  │     - isLoading
  │     - error
  │     - searchTerm
  │     - filters
  │
  └─→ Form State (React Hook Form)
        - formData
        - errors
        - isDirty
        - isValid
```

This comprehensive flow documentation helps understand how data moves through the application and how users interact with different features.
