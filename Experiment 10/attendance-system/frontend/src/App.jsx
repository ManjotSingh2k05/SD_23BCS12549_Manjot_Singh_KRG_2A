import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check localStorage for logged-in user/admin
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");

    if (storedUser) setIsLoggedIn(true);
    if (storedAdmin) setIsAdmin(true);
  }, []);

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/profile" /> : <Login setIsLoggedIn={setIsLoggedIn} />
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? <Navigate to="/profile" /> : <Signup />
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? <Profile setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/" />
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-login"
          element={
            isAdmin ? <Navigate to="/admin" /> : <AdminLogin setIsAdmin={setIsAdmin} />
          }
        />
        <Route
          path="/admin"
          element={
            isAdmin ? <AdminDashboard setIsAdmin={setIsAdmin} /> : <Navigate to="/admin-login" />
          }
        />

        {/* Fallback route for unmatched paths */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/profile" : "/"} />} />
      </Routes>
    </Router>
  );
};

export default App;
