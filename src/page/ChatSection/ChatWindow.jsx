import React, { useState, useEffect, useRef, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { FaVideo, FaArrowLeft, FaEllipsisV, FaPaperclip, FaPaperPlane, FaSmile, FaFile, FaTimes, FaImage } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from "emoji-picker-react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useOutsideClick from "../../hooks/useOutsideClick";
import { useChatStore } from "../../store/chatStore";
import useVideoCallStore from "../../store/videoCallStore";
import { getSocket } from "../../services/chat.service";
import VideoCallManager from '../VideoCall/VideoCallManager'


const isValidDate = (date) => date instanceof Date &&!isNaN(date);

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { messages, loading, sendMessage, fetchMessages, isUserOnline, getUserLastSeen,deleteMessage, isUserTyping, startTyping, stopTyping } = useChatStore();
 

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  useEffect(() => {
    if (selectedContact?._id) {
      fetchMessages(selectedContact._id);
      const socket = getSocket();
      socket?.emit("chatting_with", selectedContact._id);
    }
  }, [selectedContact?._id]);

  // Group messages by date - Today / Yesterday
  const groupedMessages = useMemo(() => {
    if (!messages?.length) return {};
    return messages.reduce((acc, msg) => {
      if (!msg.createdAt) return acc;
      const date = new Date(msg.createdAt);
      if (!isValidDate(date)) return acc;
      const dateKey = format(date, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      if (!acc[dateKey].some((m) => m._id === msg._id)) {
        acc[dateKey].push(msg);
      }
      return acc;
    }, {});
  }, [messages]);

  const renderDateSeparator = (date) => {
    if (!isValidDate(date)) return null;
    let dateString;
    if (isToday(date)) dateString = "Today";
    else if (isYesterday(date)) dateString = "Yesterday";
    else dateString = format(date, "EEEE, MMMM d");

    return (
      <div className="flex justify-center my-4">
        <span className={`px-3 py-1 rounded-full text-xs shadow-sm ${theme === "dark"? "bg-[#182533] text-gray-300" : "bg-white text-gray-600"}`}>
          {dateString}
        </span>
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(selectedContact._id), 2000);
    }
    return () => clearTimeout(typingTimeoutRef.current);
  }, [message, selectedContact, startTyping, stopTyping]);

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });

  const handleTyping = (e) => {
    setMessage(e.target.value);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
    setShowFileMenu(false);
  };
  const handleVideoCall = () => {
    if (selectedContact && online) {
      // Get the initiateCall function from the store
      const { initiateCall } = useVideoCallStore.getState();
      console.log('this is initial call',initiateCall)

      console.log("Starting video call with selectedContact:", {
        id: selectedContact._id,
        name: selectedContact.username,
        avatar: selectedContact.profilePicture, // This should be the URL, not "video"
        fullContact: selectedContact,
      });

      // Make sure we're passing the correct profile picture URL
      const avatarUrl =
        selectedContact.profilePicture ||
        "/placeholder.svg?height=128&width=128";

      initiateCall(
        selectedContact._id,
        selectedContact.username,
        avatarUrl, // Pass the actual URL, not "video"
        "video"
      );
    } else {
      alert("User is offline. Cannot initiate video call.");
    }
  };


  const handleSend = async () => {
    if (!message.trim() &&!selectedFile) return;
    try {
      await sendMessage({ receiverId: selectedContact._id, message, file: selectedFile });
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      stopTyping(selectedContact._id);
    } catch (err) {
      console.error(err);
    }
  };

  const getAvatar = () => selectedContact?.profilePicture || selectedContact?.profilePic?.url || `https://api.dicebear.com/6.x/avataaars/svg?seed=${selectedContact?._id}`;
  const getName = () => selectedContact?.fullName || selectedContact?.username || selectedContact?.phoneNumber || "User";

  return (
    <>
    <div className={`flex flex-col h-screen ${theme === "dark"? "bg-[#0b141a]" : "bg-[#efeae2]"}`}>
      {/* Header */}
      <div className={`flex items-center p-3 ${theme === "dark"? "bg-[#202c33]" : "bg-[#f0f2f5]"} border-b`}>
        <button onClick={() => setSelectedContact(null)} className="md:hidden mr-3"><FaArrowLeft /></button>
        <img src={getAvatar()} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
        <div className="ml-3 flex-1">
          <h3 className={`font-semibold ${theme === "dark"? "text-white" : "text-black"}`}>{getName()}</h3>
          <p className="text-xs text-gray-400">
            {isTyping? "typing..." : online? "online" : lastSeen? `last seen ${format(new Date(lastSeen), "p")}` : "offline"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
            <button
              className="focus:outline-none"
              onClick={handleVideoCall}
              title={online ? "Start video call" : "User is offline"}
            >
              <FaVideo
                className={`h-5 w-5 text-green-500 hover:text-green-600`}
              />
            </button>
            <button className="focus:outline-none">
              <FaEllipsisV className="h-5 w-5" />
            </button>
          </div>
      </div>

      {/* Messages - Date wise */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ backgroundImage: theme === "light"? "url('/whatsapp-bg.png')" : "none" }}>
        {loading? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : Object.keys(groupedMessages).length === 0? (
          <p className="text-center text-gray-400 mt-10">No messages yet. Say hi 👋</p>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs.map((msg) => (
                <MessageBubble key={msg._id} message={msg} theme={theme} currentUser={user} />
              ))}
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {filePreview && (
        <div className={`relative p-2 flex justify-center ${theme === "dark"? "bg-[#202c33]" : "bg-white"} border-t`}>
          {selectedFile?.type.startsWith("video/")? (
            <video src={filePreview} controls className="w-80 rounded-lg shadow" />
          ) : (
            <img src={filePreview} alt="preview" className="w-80 rounded-lg shadow object-cover" />
          )}
          <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      )}

      {selectedFile &&!filePreview && (
        <div className={`flex items-center p-2 ${theme === "dark"? "bg-[#202c33]" : "bg-white"} border-t`}>
          <FaFile className="mr-2" />
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)}><FaTimes /></button>
        </div>
      )}

      {/* Input */}
      <div className={`flex items-center p-2 ${theme === "dark"? "bg-[#202c33]" : "bg-[#f0f2f5]"}`}>
        <div className="relative">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2"><FaSmile className="text-gray-500" /></button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50">
              <EmojiPicker onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)} theme={theme} />
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)} className="p-2"><FaPaperclip className="text-gray-500" /></button>
          {showFileMenu && (
            <div className={`absolute bottom-12 left-0 p-2 rounded-lg shadow-lg flex flex-col gap-1 ${theme === "dark"? "bg-[#233138] text-white" : "bg-white"}`}>
              <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} accept="image/*,video/*,application/*" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 hover:bg-black/10 rounded"><FaImage /> Image/Video</button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 hover:bg-black/10 rounded"><FaFile /> Document</button>
            </div>
          )}
        </div>

        <input
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message"
          className={`flex-1 mx-2 px-4 py-2 rounded-full focus:outline-none ${theme === "dark"? "bg-[#2a3942] text-white" : "bg-white text-black"}`}
        />
        <button onClick={handleSend} className="p-3 bg-green-500 rounded-full text-white hover:bg-green-600"><FaPaperPlane /></button>
      </div>
    </div>
    <VideoCallManager socket={socket}  /></>
  );
};

export default ChatWindow;