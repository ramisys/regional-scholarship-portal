import { Link, useLocation, useNavigate } from "react-router";
import {
  CheckCircle,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/AuthContext";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const studentLinks = [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/apply", label: "Apply", icon: FileText },
    { to: "/student/applications", label: "My Applications", icon: CheckCircle },
  ];

  const coordinatorLinks = [
    { to: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/coordinator/applications", label: "Applications", icon: Users },
  ];

  const links = user?.role === "coordinator" ? coordinatorLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:sticky md:top-0 md:flex h-dvh w-64 shrink-0 border-r border-gray-200 bg-white flex-col overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-semibold text-gray-900">Scholarship Portal</h1>
            <p className="text-xs text-gray-500">Regional MVP</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-3">
          <p className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
