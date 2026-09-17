import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import UserDetails from "./components/UserDetails";
import Settings from "./components/Settings";
import userStore from "./store/useUserStore";
import useThemeStore from "./store/themeStore";
import { useEffect, useState } from "react";
import { checkUserAuth } from "./services/user.service";
import { initializeSocket } from "./services/chat.service";

function Protected({ children }) {
  const { isAuthenticated, user, setUser, clearUser } = userStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const res = await checkUserAuth();
      if (res.isAuthenticated) {
        setUser(res.user);
        initializeSocket();
      } else {
        clearUser();
      }
      setLoading(false);
    };
    if (!isAuthenticated || !user) verify();
    else setLoading(false);
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const { theme } = useThemeStore();
  return (
    <div className={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><HomePage /></Protected>} />
          <Route path="/user-details" element={<Protected><UserDetails /></Protected>} />
          <Route path="/setting" element={<Protected><Settings /></Protected>} />
        </Routes>
      </Router>
      <ToastContainer theme={theme} position="bottom-right" />
    </div>
  );
}
