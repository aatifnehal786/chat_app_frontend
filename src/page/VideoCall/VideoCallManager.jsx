"use client"

import { useEffect, useCallback } from "react"
import useVideoCallStore from "../../store/videoCallStore"
import useUserStore from "../../store/useUserStore"
import VideoCallModal from "./VideoCallModal"

const VideoCallManager = ({ socket }) => {
  const { user: loggedUser } = useUserStore();
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    setCallStatus,
    endCall
  } = useVideoCallStore()

  useEffect(() => {
    if (!socket) return

    const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType, callId }) => {
      console.log("Received incoming call:", { callerId, callerName, callerAvatar, callType, callId })
      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId,
      })
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("ringing")
    }

    const handleCallFailed = ({ reason }) => {
      console.error("Call failed:", reason)
      setCallStatus("failed")
      setTimeout(() => {
        endCall()
      }, 2000)
    }

    socket.on("incoming_call", handleIncomingCall)
    socket.on("call_failed", handleCallFailed)

    return () => {
      socket.off("incoming_call", handleIncomingCall)
      socket.off("call_failed", handleCallFailed)
    }
  }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall])

  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      if (!loggedUser?._id) {
        console.error("Cannot initiate call: user not loaded");
        return;
      }
      if (!socket) {
        console.error("Cannot initiate call: socket not connected");
        return;
      }

      const callId = `${loggedUser._id}-${receiverId}-${Date.now()}`

      console.log("Initiating call with:", {
        receiverId,
        receiverName,
        receiverAvatar,
        callType,
        callId,
      })

      // Validate avatar URL
      const validatedAvatar =
        receiverAvatar && receiverAvatar!== "video" && receiverAvatar.startsWith("http")
         ? receiverAvatar
          : receiverAvatar || "/placeholder.svg?height=128&width=128"

      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: validatedAvatar,
      }

      setCurrentCall(callData)
      setCallType(callType)
      setCallModalOpen(true)
      setCallStatus("calling")

      socket.emit("initiate_call", {
        callerId: loggedUser._id,
        receiverId,
        callType,
        callerInfo: {
          username: loggedUser.username || loggedUser.fullName,
          profilePicture: loggedUser.profilePicture || loggedUser.profilePic?.url,
        },
      })

      console.log("Call initiated, currentCall set to:", callData)
    },
    [
      loggedUser?._id,
      loggedUser?.username,
      loggedUser?.fullName,
      loggedUser?.profilePicture,
      loggedUser?.profilePic,
      socket,
      setCurrentCall,
      setCallType,
      setCallModalOpen,
      setCallStatus,
    ],
  )

  // Expose initiateCall to store so ChatWindow can call useVideoCallStore.getState().initiateCall()
  useEffect(() => {
    useVideoCallStore.setState({ initiateCall });
  }, [initiateCall])

  // Don't render modal if no user
  if (!loggedUser) return null;

  return <VideoCallModal socket={socket} />
}

export default VideoCallManager