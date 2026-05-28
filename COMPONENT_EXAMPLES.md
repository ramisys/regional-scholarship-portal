# Component Usage Examples

## How to Use the Built Components

### AuthContext

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.firstName}!</p>
          <p>Role: {user.role}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login('email@example.com', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}
```

### API Client

```tsx
import api, { handleApiError } from './utils/api';

async function fetchData() {
  try {
    const response = await api.get('/student/applications');
    return response.data;
  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error(errorMessage);
  }
}

async function submitData(data) {
  try {
    const response = await api.post('/student/applications', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

### Protected Route

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

// Protect any route
<Route
  path="/student/dashboard"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>

// Protect for any authenticated user
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

### UI Components

#### Button

```tsx
import { Button } from './components/ui/button';

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

#### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Input

```tsx
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

#### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

#### Dialog

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a dialog description
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

#### Table

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>{item.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>
  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
  <TabsContent value="tab3">
    Content for tab 3
  </TabsContent>
</Tabs>
```

#### Toast Notifications

```tsx
import { toast } from 'sonner';

// Success
toast.success('Operation successful!');

// Error
toast.error('Something went wrong');

// Info
toast('Information message');

// With description
toast.success('Success', {
  description: 'Your changes have been saved',
});

// Loading
const loadingToast = toast.loading('Processing...');
// Later dismiss
toast.dismiss(loadingToast);
```

#### Progress

```tsx
import { Progress } from './components/ui/progress';

<Progress value={progress} />
```

#### Badge

```tsx
import { Badge } from './components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

#### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';

interface FormData {
  firstName: string;
  email: string;
}

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          {...register('firstName', { required: 'First name is required' })}
        />
        {errors.firstName && (
          <p className="text-red-500 text-sm">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Dynamic Field Arrays

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

function DynamicForm() {
  const { control, register } = useForm({
    defaultValues: {
      schools: [{ name: '', degree: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schools'
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Input {...register(`schools.${index}.name`)} placeholder="School Name" />
          <Input {...register(`schools.${index}.degree`)} placeholder="Degree" />
          <Button type="button" onClick={() => remove(index)}>Remove</Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ name: '', degree: '' })}>
        Add School
      </Button>
    </div>
  );
}
```

### File Upload

```tsx
import { useState } from 'react';
import api from './utils/api';
import { Progress } from './components/ui/progress';

function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/student/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setProgress(percentCompleted);
        },
      });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <Progress value={progress} />}
    </div>
  );
}
```

### Creating a New Page

```tsx
// 1. Create the page component
// src/app/pages/student/NewPage.tsx
import React, { useEffect, useState } from 'react';
import api, { handleApiError } from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const NewPage: React.FC = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/student/new-endpoint');
      setData(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {error && <div className="text-red-500">{error}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your content here */}
        </CardContent>
      </Card>
    </div>
  );
};

// 2. Add route in App.tsx
import { NewPage } from './pages/student/NewPage';

<Route
  path="/student/new-page"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <Layout>
        <NewPage />
      </Layout>
    </ProtectedRoute>
  }
/>

// 3. Add to navigation in Layout.tsx
const studentNavItems = [
  // ... existing items
  { path: '/student/new-page', label: 'New Page', icon: FileText },
];
```

## Common Patterns

### Loading State

```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="mt-4">Loading...</p>
      </div>
    </div>
  );
}
```

### Error Display

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```

### Empty State

```tsx
{items.length === 0 ? (
  <div className="text-center py-12 text-gray-500">
    <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
    <p>No items found</p>
    <Button className="mt-4">Add New Item</Button>
  </div>
) : (
  <div>
    {/* Display items */}
  </div>
)}
```

### Confirmation Dialog

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';

<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Styling Tips

### Tailwind Classes

```tsx
// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Flexbox
<div className="flex items-center justify-between">

// Spacing
<div className="space-y-4">  {/* Vertical spacing */}
<div className="space-x-4">  {/* Horizontal spacing */}

// Colors
<div className="bg-blue-500 text-white">

// Hover states
<Button className="hover:bg-blue-700">

// Mobile-first
<div className="text-sm md:text-base lg:text-lg">
```

These examples cover most common use cases in the application!
