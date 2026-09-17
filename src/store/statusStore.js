import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStatusStore = create((set) => ({
  statuses: [],
  loading: false,
  error: null,
  setStatuses: (statuses) => set({ statuses }),
}));

export default useStatusStore;
