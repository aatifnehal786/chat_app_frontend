import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    peerConnection: null,
    iceCandidatesQueue: [],
    isCallModalOpen: false,
    callStatus: "idle",
    setCurrentCall: (call) => set({ currentCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setCallActive: (active) => set({ isCallActive: active }),
    setCallType: (type) => set({ callType: type }),
    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    setPeerConnection: (pc) => set({ peerConnection: pc }),
    setCallModalOpen: (open) => set({ isCallModalOpen: open }),
    setCallStatus: (status) => set({ callStatus: status }),
    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      localStream?.getVideoTracks().forEach((t) => (t.enabled = !isVideoEnabled));
      set({ isVideoEnabled: !isVideoEnabled });
    },
    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      localStream?.getAudioTracks().forEach((t) => (t.enabled = !isAudioEnabled));
      set({ isAudioEnabled: !isAudioEnabled });
    },
    endCall: () => {
      const { localStream, peerConnection } = get();
      localStream?.getTracks().forEach((t) => t.stop());
      peerConnection?.close();
      set({ currentCall: null, incomingCall: null, isCallActive: false, isCallModalOpen: false, callStatus: "idle", localStream: null, remoteStream: null, peerConnection: null });
    },
    initiateCall: (receiverId, receiverName, receiverAvatar, type = "video") => {
      set({ currentCall: { participantId: receiverId, participantName: receiverName, participantAvatar: receiverAvatar }, callType: type, isCallModalOpen: true, callStatus: "calling" });
    },
  }))
);

export default useVideoCallStore;
