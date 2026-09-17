import React, { useState, useRef } from "react";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hooks/useOutsideClick";
import { FaCheck, FaCheckDouble, FaTrash, FaRegCopy } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useChatStore } from "../../store/chatStore";

const MessageBubble = ({ message, theme, currentUser }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);
  const emojiRef = useRef(null);
  const { deleteMessage, addReaction } = useChatStore();

  useOutsideClick(optionsRef, () => showOptions && setShowOptions(false));
  useOutsideClick(emojiRef, () => showEmojiPicker && setShowEmojiPicker(false));

  if (!message) return null;
  if (message.isDeleted) {
    return (
      <div className={`chat ${String(message.sender?._id || message.sender) === String(currentUser._id) ? "chat-end" : "chat-start"}`}>
        <div className={`chat-bubble italic text-gray-400 ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}>This message was deleted</div>
      </div>
    );
  }

  const senderId = typeof message.sender === "object" ? message.sender._id : message.sender;
  const isUserMessage = String(senderId) === String(currentUser._id);

  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";
  const bubbleColor = isUserMessage
    ? theme === "dark" ? "bg-[#005c4b] text-white" : "bg-[#d9fdd3] text-black"
    : theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black";

  return (
    <div className={`chat ${bubbleClass} group`}>
      <div className={`chat-bubble relative md:max-w-[55%] min-w-[120px] ${bubbleColor}`}>
        {/* Options */}
        <button onClick={() => setShowOptions(!showOptions)} className="absolute -top-2 -right-2 hidden group-hover:block bg-gray-200 rounded-full p-1">
          <HiDotsVertical className="text-xs" />
        </button>
        {showOptions && (
          <div ref={optionsRef} className={`absolute ${isUserMessage ? "right-0" : "left-0"} top-6 z-10 w-40 rounded shadow-lg p-2 ${theme === "dark" ? "bg-[#233138] text-white" : "bg-white text-black"}`}>
            <button onClick={() => { navigator.clipboard.writeText(message.message); setShowOptions(false); }} className="flex items-center gap-2 w-full p-1 hover:bg-gray-100"><FaRegCopy /> Copy</button>
            <button onClick={() => { deleteMessage(message._id, false); setShowOptions(false); }} className="flex items-center gap-2 w-full p-1 hover:bg-gray-100"><FaTrash /> Delete for me</button>
            {isUserMessage && <button onClick={() => { deleteMessage(message._id, true); setShowOptions(false); }} className="flex items-center gap-2 w-full p-1 hover:bg-gray-100"><FaTrash /> Delete for everyone</button>}
          </div>
        )}

        {/* File */}
        {message.fileUrl && (
          <div className="mb-1">
            {message.fileType?.startsWith("image/") ? (
              <img src={message.fileUrl} alt={message.originalFileName} className="rounded max-w-[250px]" />
            ) : (
              <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded">
                📎 {message.originalFileName || "File"} {message.fileSize ? `(${(message.fileSize/1024).toFixed(1)}KB)` : ""}
              </a>
            )}
          </div>
        )}

        {/* Text - already decrypted by backend post hook */}
        {message.messageType === "call_log" ? (
          <div className="text-xs italic">📞 {message.message} {message.callInfo?.duration ? `- ${message.callInfo.duration}s` : ""}</div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        )}

        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] opacity-60">{message.createdAt ? format(new Date(message.createdAt), "p") : ""}</span>
          {isUserMessage && (
            <span className="text-[12px]">
              {message.isSeen ? <FaCheckDouble className="text-blue-400" /> : message.isDelivered ? <FaCheckDouble /> : <FaCheck />}
            </span>
          )}
        </div>

        {message.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1">
            {message.reactions.map((r, i) => <span key={i} className="text-xs bg-white rounded-full px-1">{r.emoji}</span>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
