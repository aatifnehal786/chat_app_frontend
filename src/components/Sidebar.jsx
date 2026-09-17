import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaWhatsapp, FaCog, FaUserCircle } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import useStore from "../store/layoutStore";
import userStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";

const Sidebar = () => {
  const location = useLocation();
  const { user } = userStore();
  const { activeTab, setActiveTab, selectedContact } = useStore();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { theme } = useThemeStore();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (location.pathname === "/") setActiveTab("chats");
    else if (location.pathname === "/status") setActiveTab("status");
    else if (location.pathname === "/user-details") setActiveTab("user");
    else if (location.pathname === "/setting") setActiveTab("setting");
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) return null;

  const iconClass = (tab) =>
    `h-6 w-6 ${activeTab === tab? "text-black" : theme === "dark"? "text-gray-400" : "text-gray-600"}`;

  const linkClass = (tab) =>
    `flex items-center justify-center p-2.5 rounded-full transition-all ${
      activeTab === tab? "bg-gray-300 shadow-sm" : ""
    }`;

  // Inline style forces bottom position even if Tailwind purges
  const containerStyle = isMobile
   ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom)",
      }
    : {
        width: "64px",
        height: "100vh",
        position: "sticky",
        top: 0,
      };

  return (
    <div
      style={containerStyle}
      className={`
        ${theme === "dark"? "bg-[#202c33] border-gray-700" : "bg-[#EFEFF0] border-gray-300"}
        ${!isMobile? "border-r-2 flex-col justify-between py-4" : "border-t shadow-[0_-2px_10px_rgba(0,0,0,0.15)] px-2"}
        flex items-center
      `}
    >
      <Link to="/" className={linkClass("chats")}>
        <FaWhatsapp className={iconClass("chats")} />
      </Link>
      <Link to="/status" className={linkClass("status")}>
        <MdRadioButtonChecked className={iconClass("status")} />
      </Link>
      {!isMobile && <div className="flex-grow" />}
      <Link to="/user-details" className={linkClass("user")}>
        {user?.profilePicture || user?.profilePic?.url? (
          <img src={user.profilePicture || user.profilePic.url} alt="User" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <FaUserCircle className={iconClass("user")} />
        )}
      </Link>
      <Link to="/setting" className={linkClass("setting")}>
        <FaCog className={iconClass("setting")} />
      </Link>
    </div>
  );
};

export default Sidebar;