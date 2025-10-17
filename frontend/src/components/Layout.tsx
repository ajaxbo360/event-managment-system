import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.tsx";
import Sidebar from "./Sidebar.tsx";

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 transition-colors">
      {/* Header  */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main  */}
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
          <div className="max-w-7xl mx-auto">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
