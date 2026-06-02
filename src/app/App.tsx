import React, { Suspense, lazy, useEffect } from 'react';
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
const AuditLogs = lazy(() =>
  import('./pages/coordinator/AuditLogs').then((module) => ({ default: module.AuditLogs }))
);

const PageTitle: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} | Regional Scholarship Portal`;
  }, [title]);

  return <>{children}</>;
};

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
            <Route path="/login" element={<PageTitle title="Login"><Login /></PageTitle>} />
            <Route path="/register" element={<PageTitle title="Register"><Register /></PageTitle>} />
            <Route path="/forgot-password" element={<PageTitle title="Forgot Password"><ForgotPassword /></PageTitle>} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageTitle title="Home"><Home /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <PageTitle title="Student Dashboard"><StudentDashboard /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/apply"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <PageTitle title="Application Form"><ApplicationForm /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/documents"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <PageTitle title="Document Upload"><DocumentUpload /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/applications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <PageTitle title="Application Tracking"><ApplicationTracking /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/applications/:applicationId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <PageTitle title="Application Detail"><ApplicationDetail /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <Layout>
                    <PageTitle title="Coordinator Dashboard"><CoordinatorDashboard /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/applications"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <Layout>
                    <PageTitle title="Application Management"><ApplicationManagement /></PageTitle>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <Layout>
                    <PageTitle title="Audit Logs"><AuditLogs /></PageTitle>
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
