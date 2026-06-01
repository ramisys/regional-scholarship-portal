import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { GraduationCap, Home, FileText, Upload, CheckCircle, LogOut, User, Menu, Loader2 } from 'lucide-react';
import { DashboardLayout } from './layout/DashboardLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: Home },
    { path: '/student/apply', label: 'Apply', icon: FileText },
    { path: '/student/applications', label: 'My Applications', icon: CheckCircle },
  ];

  const coordinatorNavItems = [
    { path: '/coordinator/dashboard', label: 'Dashboard', icon: Home },
    { path: '/coordinator/applications', label: 'Applications', icon: FileText },
  ];

  const navItems = user?.role === 'coordinator' ? coordinatorNavItems : studentNavItems;

  const isActive = (path: string) => location.pathname === path;
  const isDashboardRoute =
    location.pathname.startsWith('/student') || location.pathname.startsWith('/coordinator');

  return (
    <div className={`${isDashboardRoute ? 'h-dvh overflow-hidden' : 'min-h-screen'} bg-gray-50`}>
      <nav
        className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${
          isDashboardRoute ? 'md:hidden' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white p-2 rounded">
                  <GraduationCap size={24} />
                </div>
                <span className="font-bold text-xl hidden sm:inline">Scholarship Portal</span>
              </Link>

              <div className="hidden md:flex ml-10 space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        className="flex items-center"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {user?.role}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {isDashboardRoute ? (
        <div className="h-[calc(100dvh-4rem)] min-h-0 md:h-dvh">
          <DashboardLayout>{children}</DashboardLayout>
        </div>
      ) : (
        <main>{children}</main>
      )}

      {!isDashboardRoute && (
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500">
              © 2026 Regional Scholarship Portal. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
