import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCamera, FaPencilAlt, FaCheck, FaSmile } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import Layout from "./Layout";
import EmojiPicker from "emoji-picker-react";
import useThemeStore from "../store/themeStore";
import userStore from "../store/useUserStore";
import { updateUserProfile } from "../services/user.service";
import { toast } from "react-toastify";

export default function UserDetails() {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const { user, setUser } = userStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.fullName || user.username || "");
      setAbout(user.about || "Hey there! I am using ChatApp");
      setPreview(user.profilePicture || user.profilePic?.url || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
    // auto upload
    handleSave("avatar", file);
  };

  const handleSave = async (field, fileOverride = null) => {
    try {
      const formData = new FormData();
      if (field === "name") {
        formData.append("fullName", name);
        formData.append("username", name);
      } else if (field === "about") {
        formData.append("about", about);
      }
      if (fileOverride) {
        formData.append("profilePic", fileOverride);
      } else if (profileImage && field === "avatar") {
        formData.append("profilePic", profileImage);
      }

      const res = await updateUserProfile(formData);
      const updatedUser = res.data || res.user || res;
      setUser(updatedUser);
      toast.success("Profile updated");
      if (field === "name") setIsEditingName(false);
      if (field === "about") setIsEditingAbout(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <Layout>
      <div className={`flex flex-col items-center p-6 min-h-screen ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-white text-black"}`}>
        <h1 className="text-2xl font-semibold mb-6 self-start">Profile</h1>

        <div className="relative mb-8">
          <img src={preview || `https://api.dicebear.com/6.x/avataaars/svg?seed=${user?._id}`} alt="profile" className="h-40 w-40 rounded-full object-cover" />
          <label className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full cursor-pointer">
            <FaCamera className="text-white" />
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </label>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Name */}
          <div className={`p-4 rounded ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-100"}`}>
            <label className="text-xs text-green-500">Your name</label>
            <div className="flex items-center justify-between">
              {isEditingName ? (
                <>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={`flex-1 bg-transparent outline-none ${theme === "dark" ? "text-white" : "text-black"}`} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowNameEmoji(!showNameEmoji)}><FaSmile /></button>
                    <button onClick={() => handleSave("name")}><FaCheck className="text-green-500" /></button>
                    <button onClick={() => setIsEditingName(false)}><MdCancel /></button>
                  </div>
                </>
              ) : (
                <>
                  <span>{name}</span>
                  <button onClick={() => setIsEditingName(true)}><FaPencilAlt className="text-gray-400" /></button>
                </>
              )}
            </div>
            {showNameEmoji && isEditingName && <div className="mt-2"><EmojiPicker onEmojiClick={(e) => setName((p) => p + e.emoji)} /></div>}
          </div>

          {/* About */}
          <div className={`p-4 rounded ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-100"}`}>
            <label className="text-xs text-green-500">About</label>
            <div className="flex items-center justify-between">
              {isEditingAbout ? (
                <>
                  <input value={about} onChange={(e) => setAbout(e.target.value)} className={`flex-1 bg-transparent outline-none ${theme === "dark" ? "text-white" : "text-black"}`} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAboutEmoji(!showAboutEmoji)}><FaSmile /></button>
                    <button onClick={() => handleSave("about")}><FaCheck className="text-green-500" /></button>
                    <button onClick={() => setIsEditingAbout(false)}><MdCancel /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="truncate">{about}</span>
                  <button onClick={() => setIsEditingAbout(true)}><FaPencilAlt className="text-gray-400" /></button>
                </>
              )}
            </div>
            {showAboutEmoji && isEditingAbout && <div className="mt-2"><EmojiPicker onEmojiClick={(e) => setAbout((p) => p + e.emoji)} /></div>}
          </div>

          <div className="text-sm text-gray-500">
            <p>Phone: {user?.phoneNumber || user?.mobile || "Not set"}</p>
            <p>Email: {user?.email || "Not set"}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
