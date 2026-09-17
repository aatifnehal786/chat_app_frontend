import React, { useState } from "react";
import { FaSearch, FaUser, FaQuestionCircle, FaMoon, FaSun, FaSignOutAlt, FaComment } from "react-icons/fa";
import useThemeStore from "../store/themeStore";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import userStore from "../store/useUserStore";
import { logoutUser } from "../services/user.service";
import { toast } from "react-toastify";
import { disconnectSocket } from "../services/chat.service";

export default function Setting() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { user, clearUser } = userStore();

  const handleLogout = async () => {
    try {
      await logoutUser();
      disconnectSocket();
      clearUser();
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Logged out");
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to logout", error);
      clearUser();
      window.location.href = "/login";
    }
  };

  return (
    <Layout>
      <div className={`flex h-screen ${theme === "dark" ? "bg-[rgb(17,27,33)] text-white" : "bg-white text-black"}`}>
        <div className={`w-[400px] border-r ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>
            <div className={`flex items-center gap-3 p-3 rounded mb-4 ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-100"}`}>
              <img src={user?.profilePicture || user?.profilePic?.url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${user?._id}`} alt="user" className="h-12 w-12 rounded-full" />
              <div>
                <p className="font-medium">{user?.fullName || user?.username}</p>
                <p className="text-xs text-gray-400">{user?.about}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={`w-full flex items-center gap-3 p-3 rounded ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}>
                {theme === "dark" ? <FaSun /> : <FaMoon />} <span>Theme: {theme}</span>
              </button>
              <Link to="/user-details" className={`flex items-center gap-3 p-3 rounded ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}><FaUser /> Profile</Link>
              <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-3 rounded text-red-500 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}><FaSignOutAlt /> Logout</button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">Select a setting</div>
      </div>
    </Layout>
  );
}
