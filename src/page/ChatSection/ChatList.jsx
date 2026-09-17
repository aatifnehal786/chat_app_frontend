import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaSearch } from "react-icons/fa";
import useStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import formatTimestamp from "../../utils/formatTime";
import userStore from "../../store/useUserStore";

const ChatList = ({ contacts }) => {
  const setSelectedContact = useStore((state) => state.setSelectedContact);
  const selectedContact = useStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = userStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = contacts?.filter((c) => {
    const name = c.fullName || c.username || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getAvatar = (contact) => {
    return contact.profilePicture || contact.profilePic?.url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${contact._id}`;
  };

  const getName = (contact) => contact.fullName || contact.username || contact.phoneNumber || "Unknown";

  return (
    <div className={`w-full border-r h-screen ${theme === "dark" ? "bg-[rgb(17,27,33)] border-gray-600" : "bg-white border-gray-200"}`}>
      <div className={`p-4 flex justify-between ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
          <FaPlus />
        </button>
      </div>
      <div className="p-2">
        <div className="relative">
          <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400" : "bg-gray-100 text-black border-gray-200"}`}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filtered?.map((contact) => (
          <motion.div
            key={contact._id}
            whileHover={{ scale: 1.01 }}
            onClick={() => setSelectedContact(contact)}
            className={`flex items-center p-3 cursor-pointer border-b ${theme === "dark" ? "border-gray-700 hover:bg-[#202c33]" : "border-gray-100 hover:bg-gray-100"} ${selectedContact?._id === contact._id ? (theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200") : ""}`}
          >
            <img src={getAvatar(contact)} alt={getName(contact)} className="h-12 w-12 rounded-full object-cover" />
            <div className="ml-3 flex-1 overflow-hidden">
              <div className="flex justify-between">
                <h3 className={`font-medium truncate ${theme === "dark" ? "text-white" : "text-black"}`}>{getName(contact)}</h3>
                <span className="text-xs text-gray-400">{contact.lastMessageAt ? formatTimestamp(contact.lastMessageAt) : ""}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{contact.lastMessage || contact.about || "Hey there! I am using ChatApp"}</p>
            </div>
          </motion.div>
        ))}
        {filtered?.length === 0 && <p className="text-center text-gray-400 mt-10">No users found</p>}
      </div>
    </div>
  );
};

export default ChatList;
