import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex flex-1 bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};
