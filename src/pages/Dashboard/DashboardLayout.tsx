import React from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar/Sidebar";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="bg-gray-100 min-h-screen">
    <Topbar />
    <div className="flex">
      <Sidebar />
      {/* On desktop: ml-64 to clear the fixed sidebar.
          On mobile:  no left margin — sidebar overlays as a drawer. */}
      <main
        className="flex-1 md:ml-64 mt-16 p-4 md:p-8 h-[calc(100vh-4rem)] overflow-y-auto"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        {children}
      </main>
    </div>
  </div>
);

export default DashboardLayout;
