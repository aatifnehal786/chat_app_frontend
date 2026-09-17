import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
      step: 1, // 1: phone, 2: otp, 3: profile
      userPhoneData: null, // {mobile or email}
      authMethod: "mobile", // mobile | email
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      setAuthMethod: (method) => set({ authMethod: method }),
      resetLoginState: () => set({ step: 1, userPhoneData: null, authMethod: "mobile" }),
    }),
    {
      name: "login-storage",
      partialize: (state) => ({ step: state.step, userPhoneData: state.userPhoneData, authMethod: state.authMethod }),
    }
  )
);

export default useLoginStore;
