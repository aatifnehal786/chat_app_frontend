"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaWhatsapp, FaCheck } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { sendMobileOtp, verifyMobileOtp, sendEmailOtp, verifyEmailOtp, updateUserProfile } from "../services/user.service";
import useLoginStore from "../store/useLoginStore";
import { toast } from "react-toastify";
import userStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";
import { useNavigate } from "react-router-dom";

// ✅ FIXED - Allows EITHER mobile OR email, not both mandatory
const loginSchema = yup.object().shape({
  phoneNumber: yup
   .string()
   .transform((value, originalValue) => (originalValue?.trim() === ""? null : value))
   .nullable()
   .notRequired()
   .matches(/^\d{10}$/, { message: "Enter valid 10 digit mobile", excludeEmptyString: true }),

  email: yup
   .string()
   .transform((value, originalValue) => (originalValue?.trim() === ""? null : value))
   .nullable()
   .notRequired()
   .email("Enter valid email"),
})
.test("at-least-one", "Enter mobile number OR email", function (value) {
  const { phoneNumber, email } = value || {};
  return!!(phoneNumber || email);
});

const otpSchema = yup.object().shape({
  otp: yup.string().length(6, "6 digits").required("OTP required"),
});

export default function Login() {
  const { step, setStep, userPhoneData, setUserPhoneData, authMethod, setAuthMethod } = useLoginStore();
  const { setUser } = userStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: "", about: "Hey there! I am using ChatApp", gender: "other", profilePic: null });
  const [preview, setPreview] = useState(null);

  const { register: regLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErr }, watch } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { phoneNumber: "", email: "" }
  });
  const { register: regOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErr } } = useForm({ resolver: yupResolver(otpSchema) });

  const phoneVal = watch("phoneNumber");
  const emailVal = watch("email");

  const onSendOtp = async (data) => {
    setLoading(true);
    try {
      // Decide based on which field is filled
      if (data.phoneNumber) {
        setAuthMethod("mobile");
        setUserPhoneData({ mobile: data.phoneNumber });
        const res = await sendMobileOtp(data.phoneNumber);
        toast.success(res.message || "OTP sent to mobile");
        if (res.devOtp) toast.info(`DEV OTP: ${res.devOtp}`, { autoClose: 10000 });
      } else if (data.email) {
        setAuthMethod("email");
        setUserPhoneData({ email: data.email });
        const res = await sendEmailOtp(data.email);
        toast.success(res.message || "OTP sent to email");
      }
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async (data) => {
    setLoading(true);
    try {
      let res;
      if (authMethod === "mobile") {
        res = await verifyMobileOtp(userPhoneData.mobile, data.otp);
      } else {
        res = await verifyEmailOtp(userPhoneData.email, data.otp);
      }
      const user = res.user || res.data;
      setUser(user);
      toast.success("Verified");
      if (!user.isProfileSetup &&!user.fullName) setStep(3);
      else navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.error || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleProfileSave = async () => {
    if (!profileData.fullName) return toast.error("Name required");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("fullName", profileData.fullName);
      form.append("about", profileData.about);
      form.append("gender", profileData.gender);
      if (profileData.profilePic) form.append("profilePic", profileData.profilePic);
      const res = await updateUserProfile(form);
      setUser(res.data || res.user);
      toast.success("Profile setup done");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === "dark"? "bg-[#111b21] text-white" : "bg-[#f0f2f5] text-black"}`}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-md p-8 rounded-lg shadow-xl ${theme === "dark"? "bg-[#202c33]" : "bg-white"}`}>
        <div className="flex flex-col items-center mb-6">
          <FaWhatsapp className="text-6xl text-green-500 mb-2" />
          <h1 className="text-2xl font-bold">ChatApp</h1>
          {step === 1 && <p className="text-sm text-gray-400 mt-2">Login with Mobile OR Email</p>}
          {step === 2 && <p className="text-sm text-gray-400 mt-2">OTP sent to {userPhoneData?.mobile || userPhoneData?.email}</p>}
          {step === 3 && <p className="text-sm text-gray-400 mt-2">Setup profile</p>}
        </div>

        {step === 1 && (
          <form onSubmit={handleLoginSubmit(onSendOtp)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mobile Number</label>
              <input {...regLogin("phoneNumber")} placeholder="10 digit mobile (optional if using email)" className={`w-full p-3 rounded border mt-1 ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"} ${phoneVal? "border-green-500" : ""}`} />
              {loginErr.phoneNumber && <p className="text-red-400 text-xs mt-1">{loginErr.phoneNumber.message}</p>}
            </div>

            <div className="text-center text-gray-400 text-sm font-bold">OR</div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input {...regLogin("email")} placeholder="email@example.com (optional if using mobile)" className={`w-full p-3 rounded border mt-1 ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"} ${emailVal? "border-green-500" : ""}`} />
              {loginErr.email && <p className="text-red-400 text-xs mt-1">{loginErr.email.message}</p>}
            </div>

            {/* This shows the at-least-one error */}
            {loginErr[""] && <p className="text-red-400 text-xs text-center">{loginErr[""].message}</p>}
            {loginErr.root && <p className="text-red-400 text-xs text-center">{loginErr.root.message}</p>}
            {/* Yup test error comes as message at root */}
            {loginErr && loginErr["at-least-one"] && <p className="text-red-400 text-xs text-center">{loginErr["at-least-one"].message}</p>}
            {/* Generic form error for our custom test */}
            {Object.keys(loginErr).length > 0 &&!loginErr.phoneNumber &&!loginErr.email && (
              <p className="text-red-400 text-xs text-center">{Object.values(loginErr)[0]?.message}</p>
            )}

            <button disabled={loading} className="w-full bg-green-500 text-white p-3 rounded font-semibold hover:bg-green-600 disabled:opacity-50">
              {loading? "Sending..." : `Send OTP to ${phoneVal? "Mobile" : emailVal? "Email" : "Mobile/Email"}`}
            </button>

            <p className="text-xs text-gray-500 text-center">Enter either mobile OR email, not both mandatory</p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-4">
            <input {...regOtp("otp")} placeholder="6 digit OTP" className={`w-full p-3 rounded border tracking-widest text-center text-xl ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"}`} />
            {otpErr.otp && <p className="text-red-400 text-xs">{otpErr.otp.message}</p>}
            <button disabled={loading} className="w-full bg-green-500 text-white p-3 rounded font-semibold">{loading? "Verifying..." : "Verify OTP"}</button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-400">Change number/email</button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                <img src={preview || `https://api.dicebear.com/6.x/avataaars/svg?seed=${profileData.fullName || "user"}`} alt="preview" className="h-24 w-24 rounded-full object-cover" />
                <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full text-white text-xs">+</div>
                <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setProfileData({...profileData, profilePic: f }); setPreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
            <input placeholder="Full Name *" value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value })} className={`w-full p-3 rounded border ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"}`} />
            <input placeholder="About" value={profileData.about} onChange={(e) => setProfileData({...profileData, about: e.target.value })} className={`w-full p-3 rounded border ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"}`} />
            <select value={profileData.gender} onChange={(e) => setProfileData({...profileData, gender: e.target.value })} className={`w-full p-3 rounded border ${theme === "dark"? "bg-[#2a3942] border-gray-600 text-white" : "bg-gray-100 border-gray-200"}`}>
              <option value="other">Other</option><option value="male">Male</option><option value="female">Female</option>
            </select>
            <button onClick={handleProfileSave} disabled={loading} className="w-full bg-green-500 text-white p-3 rounded font-semibold flex items-center justify-center gap-2"><FaCheck /> {loading? "Saving..." : "Finish Setup"}</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}