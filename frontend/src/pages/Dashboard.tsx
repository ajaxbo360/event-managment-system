import { useAuth } from "@/contexts/AuthContext.tsx";
import React from "react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard {user?.name} 🎉</p>
    </div>
  );
};

export default Dashboard;
