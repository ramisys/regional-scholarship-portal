import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-full min-h-0 bg-gray-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};
