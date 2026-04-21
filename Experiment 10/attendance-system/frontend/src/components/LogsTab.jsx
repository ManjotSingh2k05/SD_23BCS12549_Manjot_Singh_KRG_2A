import React, { useState, useEffect } from "react";

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "https://your-backend.com/api/logs"; // set API

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch logs");
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <p>Loading logs...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Attendance Logs</h2>
      {logs.length === 0 ? (
        <p className="text-gray-500">No logs available.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log, i) => (
            <li
              key={i}
              className="bg-white p-3 shadow rounded flex justify-between items-center"
            >
              <span className="font-medium">{log.user}</span>
              <span className="text-gray-700">{log.session}</span>
              <span className="text-gray-500 text-sm">{log.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
