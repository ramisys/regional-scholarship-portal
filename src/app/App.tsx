import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Toaster } from './components/ui/sonner';
import { FullScreenLoader, GlobalRequestBar } from './components/loading';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Login = lazy(() => import('./pages/auth/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() =>
  import('./pages/auth/ForgotPassword').then((module) => ({ default: module.ForgotPassword }))
);

const StudentDashboard = lazy(() =>
  import('./pages/student/Dashboard').then((module) => ({ default: module.StudentDashboard }))
);
const ApplicationForm = lazy(() =>
  import('./pages/student/ApplicationForm').then((module) => ({ default: module.ApplicationForm }))
);
const DocumentUpload = lazy(() =>
  import('./pages/student/DocumentUpload').then((module) => ({ default: module.DocumentUpload }))
);
const ApplicationTracking = lazy(() =>
  import('./pages/student/ApplicationTracking').then((module) => ({ default: module.ApplicationTracking }))
);
const ApplicationDetail = lazy(() =>
  import('./pages/student/ApplicationDetail').then((module) => ({ default: module.ApplicationDetail }))
);

const CoordinatorDashboard = lazy(() =>
  import('./pages/coordinator/Dashboard').then((module) => ({ default: module.CoordinatorDashboard }))
);
const ApplicationManagement = lazy(() =>
  import('./pages/coordinator/ApplicationManagement').then((module) => ({ default: module.ApplicationManagement }))
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalRequestBar />
        <Suspense
          fallback={
            <FullScreenLoader
              title="Loading page"
              description="Preparing the next screen"
            />
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Home />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <StudentDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/apply"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <ApplicationForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/documents"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <DocumentUpload />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <ApplicationTracking />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/applications/:applicationId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <ApplicationDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <Layout>
                    <CoordinatorDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/applications"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <Layout>
                    <ApplicationManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
