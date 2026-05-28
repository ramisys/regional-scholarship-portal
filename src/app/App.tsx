import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Toaster } from './components/ui/sonner';

import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

import { StudentDashboard } from './pages/student/Dashboard';
import { ApplicationForm } from './pages/student/ApplicationForm';
import { DocumentUpload } from './pages/student/DocumentUpload';
import { ApplicationTracking } from './pages/student/ApplicationTracking';

import { CoordinatorDashboard } from './pages/coordinator/Dashboard';
import { ApplicationManagement } from './pages/coordinator/ApplicationManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
