import React, { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import api, { handleApiError } from '../../utils/api';
import { CheckCircle2, GraduationCap } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await api.post('/auth/password-reset', { email });
      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <h1 className="font-semibold text-gray-900">Scholarship Portal</h1>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-gray-900 text-xl font-semibold">Check your email</h2>
              <p className="text-gray-500">
                Password reset instructions have been sent to your email address.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-gray-900 text-xl font-semibold">Reset your password</h2>
              <p className="text-gray-500">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Password reset instructions have been sent to your email.
            </div>
          )}

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="you@example.com"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset instructions'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
