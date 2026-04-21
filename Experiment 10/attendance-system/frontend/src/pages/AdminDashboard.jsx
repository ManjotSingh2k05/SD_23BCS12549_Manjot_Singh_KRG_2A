import { useState } from "react";
import SessionTab from "../components/SessionTab";
import StudentsTab from "../components/StudentsTab";
import LogsTab from "../components/LogsTab";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard({ setIsAdmin }) {
  const [activeTab, setActiveTab] = useState("sessions");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    setIsAdmin(false);
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white flex justify-between items-center px-6 py-3 shadow">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="space-x-4">
          <button onClick={() => setActiveTab("sessions")}>QR Sessions</button>
          <button onClick={() => setActiveTab("students")}>Students</button>
          <button onClick={() => setActiveTab("logs")}>Logs</button>
          <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded">
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">
        {activeTab === "sessions" && <SessionTab />}
        {activeTab === "students" && <StudentsTab />}
        {activeTab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}
