import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { handleApiError } from '../../utils/api';
import { GraduationCap } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'coordinator',
    honeypot: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        honeypot: formData.honeypot,
      });
      navigate('/');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="h-10 w-10 text-blue-600" />
              <h1 className="font-semibold text-gray-900">Scholarship Portal</h1>
            </div>
            <h2 className="mb-2 text-gray-900 text-2xl font-semibold">Create your account</h2>
            <p className="text-gray-500">Start your scholarship application journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <input
              type="text"
              name="website"
              value={formData.honeypot}
              onChange={(e) => handleChange('honeypot', e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <Label htmlFor="role">Account Type</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-8">
        <div className="text-white max-w-md">
          <h2 className="mb-4 text-2xl font-semibold">Join Thousands of Scholars</h2>
          <p className="text-blue-100">
            Create your account today and unlock access to regional scholarship opportunities that
            can transform your educational journey.
          </p>
        </div>
      </div>
    </div>
  );
};
