import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "../page/ChatSection/ChatWindow";
import useStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }) {
  const selectedContact = useStore((state) => state.selectedContact);
  const setSelectedContact = useStore((state) => state.setSelectedContact);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();

  const isUserDetailsPage = location.pathname === "/user-details";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop layout - no animation, both panels visible
  if (!isMobile) {
    return (
      <div className={`min-h-screen w-full flex flex-row ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"}`}>
        <Sidebar />
        <div className="flex-1 flex overflow-hidden">
          <div className={`w-full ${isUserDetailsPage ? "md:w-2/5" : "md:w-2/5"} h-screen overflow-hidden`}>
            {children}
          </div>
          <div className="flex-1 h-screen overflow-hidden">
            {selectedContact ? (
              <ChatWindow selectedContact={selectedContact} setSelectedContact={setSelectedContact} />
            ) : (
              <div className={`flex items-center justify-center h-full ${theme === "dark" ? "bg-[#222e35]" : "bg-[#f0f2f5]"} text-gray-500`}>
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout - with slide animation
  return (
    <div className={`min-h-screen w-full flex flex-col ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"} relative`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {!selectedContact ? (
            <motion.div
              key="chatList"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="chatWindow"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              className="flex-1 h-full"
            >
              <ChatWindow selectedContact={selectedContact} setSelectedContact={setSelectedContact} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile sidebar - fixed, outside AnimatePresence */}
      {!selectedContact && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', zIndex: 9999 }}>
          <Sidebar />
        </div>
      )}
    </div>
  );
}