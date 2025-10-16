import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Calendar, BookCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    {
      to: "/dashboard",
      icon: <Home className="w-5 h-5" />,
      label: "Dashboard",
    },
    {
      to: "/calendar",
      icon: <Calendar className="w-5 h-5" />,
      label: "Events Calendar",
    },
    {
      to: "/my-events",
      icon: <BookCheck className="w-5 h-5" />,
      label: "My Events",
    },
    {
      to: "/admin",
      icon: <Shield className="w-5 h-5" />,
      label: "Admin Panel",
      adminOnly: true,
    },
  ];

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin()
  );

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col mt-16">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "transition-transform duration-200",
                        isActive && "scale-110"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Admin Badge (if admin) */}
          {isAdmin() && (
            <div className="px-4 py-3 mx-3 mt-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                You can see draft events and manage all content
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      {/* <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                )
              }
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav> */}
    </>
  );
};

export default Sidebar;
