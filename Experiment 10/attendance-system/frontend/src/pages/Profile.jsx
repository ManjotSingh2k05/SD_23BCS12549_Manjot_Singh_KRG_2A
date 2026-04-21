import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Note: We are using a community package for QR scanning, assuming it's available in your environment.
import { Html5QrcodeScanner } from "html5-qrcode"; 
import { motion, AnimatePresence } from "framer-motion";

// --- Configuration and Utilities ---

// const USER_ID = "simulated_student_123"; 
const API_CHECK_IN_URL = "http://localhost:8080/api/attendance/check-in";

let storedUser = null;
try {
  const raw = localStorage.getItem("user");
  if (raw) storedUser = JSON.parse(raw);
} catch (e) {
  console.warn("Invalid user data in localStorage:", e);
}
const USER_ID = storedUser?.id || null;
console.log("Loaded USER_ID:", USER_ID, "Stored User:", storedUser);




/**
 * Helper function for robust API calls with exponential backoff.
 */
const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If the response is not ok (4xx, 5xx), read the body to get the error message
      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.message || `Server error (Status: ${response.status})`;
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};


// --- Toast/Message Component for User Feedback ---

const ToastMessage = ({ message, type, onClose }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-xl shadow-xl z-50 transition-transform duration-300 ease-out transform translate-x-0`}>
      <p className="font-semibold">{message}</p>
      <button onClick={onClose} className="absolute top-1 right-2 text-white opacity-70 hover:opacity-100">
        &times;
      </button>
    </div>
  );
};

export default function Profile({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const scannerRef = useRef(null);

  const showToast = (msg, type) => {
    setMessage({ text: msg, type });
  };
  
  const clearToast = () => setMessage(null);


  // --- MOCK DATA ---
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      subject: "Math",
      attended: 8,
      total: 10,
      percentage: 80,
      sessions: [
        { date: "2025-09-20", status: "Present" },
        { date: "2025-09-22", status: "Absent" },
        { date: "2025-09-25", status: "Present" },
        { date: "2025-09-27", status: "Present" },
        { date: "2025-09-28", status: "Absent" },
      ],
    },
    {
      subject: "Physics",
      attended: 7,
      total: 10,
      percentage: 70,
      sessions: [
        { date: "2025-09-19", status: "Absent" },
        { date: "2025-09-21", status: "Present" },
        { date: "2025-09-24", status: "Present" },
        { date: "2025-09-26", status: "Present" },
        { date: "2025-09-29", status: "Absent" },
      ],
    },
    {
      subject: "Chemistry",
      attended: 9,
      total: 10,
      percentage: 90,
      sessions: [
        { date: "2025-09-18", status: "Present" },
        { date: "2025-09-23", status: "Present" },
        { date: "2025-09-27", status: "Present" },
        { date: "2025-09-30", status: "Present" },
        { date: "2025-10-01", status: "Present" },
      ],
    },
  ]);

  const [events, setEvents] = useState([
    { title: "Science Fair", date: "2025-10-01" },
    { title: "Guest Lecture", date: "2025-09-28" },
    { title: "Workshop", date: "2025-09-26" },
    { title: "Seminar", date: "2025-09-25" },
    { title: "Extra Event", date: "2025-09-24" },
  ]);
  // --- END MOCK DATA ---


  const handleLogout = () => {
    // In a real app, this would involve clearing a JWT token or server-side session
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  /**
   * Main function to handle a successful QR code scan.
   * Sends the decoded token to the backend for check-in validation.
   */
  const handleScan = async (decodedText) => {
  if (isScanning) return;

  console.log("Decoded QR text:", decodedText); // 👀 Log scanned content

  // Filter out invalid blobs (camera or image links)
  if (!decodedText || decodedText.startsWith("blob:") || decodedText.length < 10) {
    showToast("❌ Invalid QR code detected. Please scan a valid attendance QR.", "error");
    return;
  }

  setIsScanning(true);
  setCameraOpen(false);
  scannerRef.current?.clear().catch(() => {});
  showToast("Token detected. Checking attendance...", "success");

  try {

    if (!USER_ID) throw new Error("User not authenticated. Please log in again.");

    const result = await fetchWithRetry(API_CHECK_IN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": USER_ID,
      },
      body: JSON.stringify({ token: decodedText }),
    });

    // Safely parse the backend response
    if (result && typeof result === "object" && result.message) {
      showToast(`✅ Check-in Success! ${result.message}`, "success");
    } else {
      showToast(`Attendance recorded, but status is unclear.`, "success");
      console.log("Unexpected result:", result);
    }

    } catch (error) {
      showToast(`❌ Check-in Failed: ${error.message}`, "error");
      console.error("Check-in error:", error);
    }   finally {
      setIsScanning(false);
    }
  };



  /**
   * Initializes and cleans up the QR code scanner (Html5QrcodeScanner).
   */
  useEffect(() => {
    if (cameraOpen) {
        // Show a message to the user while camera loads
        showToast("Accessing camera. Please hold QR code steady.", "info");

        // Use a descriptive element ID for the scanner container
        scannerRef.current = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: {width: 250, height: 250}, // Define the scanning area size
            disableFlip: false, // Allow camera mirroring
        }, 
        true // Verbose logging disabled
        );
        
        // Render the scanner with callbacks
        scannerRef.current.render(
            handleScan, 
            (err) => console.warn(err) // Warning log for continuous scanning errors
        );
        
    } else {
        // Cleanup function for when the camera is closed or component unmounts
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => {
                console.warn("Failed to clear scanner:", e);
            });
        }
        scannerRef.current = null;
    }

    return () => {
      // Final cleanup on unmount
      if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
      }
    };
  }, [cameraOpen]); // Dependency on cameraOpen state

  const openSubjectModal = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  // Limit to latest 4 events for a clean dashboard view
  const latestEvents = events.slice(0, 4);

  return (
    <div className="p-6 max-w-6xl mx-auto relative bg-gray-50 min-h-screen">
      {/* Toast Notification Area */}
      {message && <ToastMessage message={message.text} type={message.type} onClose={clearToast} />}

      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500">
        <h1 className="text-3xl font-extrabold text-gray-800">Welcome Back, Student!</h1>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      {/* Attendance Overview */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Subjects Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendanceRecords.map((rec, idx) => {
            const radius = 16;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (rec.percentage / 100) * circumference;

            return (
              <motion.div
                key={idx}
                onClick={() => openSubjectModal(rec)}
                className="cursor-pointer bg-white border rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition duration-300"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                {/* Circular progress */}
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle
                      className="text-gray-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="transparent"
                      r={radius}
                      cx="18"
                      cy="18"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                      className={rec.percentage >= 75 ? "text-green-500" : "text-red-500"}
                      strokeWidth="3.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference} 
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.5, type: "spring" }}
                      strokeLinecap="round"
                      fill="transparent"
                      r={radius}
                      cx="18"
                      cy="18"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
                    {rec.percentage}%
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">{rec.subject}</h3>
                <p className="text-gray-500 mt-1 text-sm">
                  Attended: {rec.attended}/{rec.total} sessions
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* QR Scanner and Check-in Section */}
      <div className="mb-10 p-8 bg-white rounded-2xl shadow-xl border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-6 text-gray-700 text-center">QR Attendance Check-in</h2>

        <div className="text-center min-h-[350px]">
          <button
            onClick={() => setCameraOpen(!cameraOpen)}
            disabled={isScanning}
            className={`px-8 py-4 text-white font-bold rounded-full shadow-lg transition duration-300 transform hover:scale-105 ${
              cameraOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {cameraOpen ? "Close Camera" : "Open QR Scanner"}
          </button>
          
          {cameraOpen && (
            <div className="w-full max-w-md mx-auto mt-8 p-4 border border-gray-300 rounded-xl overflow-hidden shadow-2xl">
              <p className="text-sm text-gray-600 mb-3">Scanning for live session code...</p>
              <div 
                id="qr-reader"
                className="w-full h-full"
              />
            </div>
          )}
          {isScanning && (
            <p className="mt-4 text-lg font-semibold text-blue-600">Processing Check-in...</p>
          )}
        </div>
      </div>


      {/* Recent Events */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Recent Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {latestEvents.map((event, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition flex justify-between items-center border border-gray-100"
            >
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">{event.title}</h4>
                <p className="text-gray-500 text-sm mt-0.5">Date: {event.date}</p>
              </div>
              <span className="text-blue-500 font-medium">Upcoming</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showModal && selectedSubject && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />

            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-lg bg-white rounded-3xl shadow-2xl z-50 p-8 border-t-4 border-blue-600"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800">{selectedSubject.subject} Session History</h2>
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {selectedSubject.sessions.map((s, idx) => (
                  <li
                    key={idx}
                    className={`p-4 rounded-xl flex justify-between items-center transition duration-200 shadow-md ${
                      s.status === "Present"
                        ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                        : "bg-red-100 text-red-800 border-l-4 border-red-500"
                    }`}
                  >
                    <p className="text-md font-medium">{s.date}</p>
                    <span className="text-md font-semibold">{s.status}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={closeModal}
                className="mt-6 w-full bg-blue-600 text-white rounded-full py-3 hover:bg-blue-700 transition font-semibold shadow-lg"
              >
                Close Details
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
