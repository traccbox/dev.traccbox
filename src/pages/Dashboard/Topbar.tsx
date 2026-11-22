import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white shadow flex items-center justify-between px-6 z-30">
      <div className="font-bold text-sm md:text-xl text-traccbox-500 ml-14 md:ml-64">
        TraccBox Dashboard
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user?.email}</span>
        <button
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="bg-traccbox-500 text-white px-3 py-1 rounded hover:bg-traccbox-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
