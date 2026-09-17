"use client"
import { useEffect, useRef, useMemo } from "react"
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaTimes } from "react-icons/fa"
import useVideoCallStore from "../../store/videoCallStore"
import useUserStore from "../../store/useUserStore"
import useThemeStore from "../../store/themeStore"

const VideoCallModal = ({ socket }) => {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pendingIceRef = useRef([])

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    callStatus,
    isCallModalOpen,
    toggleVideo,
    toggleAudio,
    endCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    setCallActive,
    clearIncomingCall,
    setCurrentCall,
  } = useVideoCallStore()

  const { user } = useUserStore()
  const { theme } = useThemeStore()

  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }

  const displayInfo = useMemo(() => {
    if (incomingCall &&!isCallActive) return { name: incomingCall.callerName, avatar: incomingCall.callerAvatar }
    if (currentCall) return { name: currentCall.participantName, avatar: currentCall.participantAvatar }
    return null
  }, [incomingCall, currentCall, isCallActive])

  useEffect(() => {
    if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected")
      setCallActive(true)
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive])

  const initializeMedia = async (video = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video? { width: 640, height: 480 } : false,
      audio: true,
    })
    setLocalStream(stream)
    return stream
  }

  const createPC = (stream, role, participantId, callId) => {
    const pc = new RTCPeerConnection(rtcConfig)

    stream?.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.onicecandidate = (e) => {
      if (e.candidate && socket && participantId && callId) {
        socket.emit("webrtc_ice_candidate", {
          candidate: e.candidate,
          receiverId: participantId,
          callId,
        })
      }
    }

    pc.ontrack = (e) => {
      console.log(`${role} ontrack`, e.streams[0]?.id)
      const stream = e.streams[0] || new MediaStream([e.track])
      setRemoteStream(stream)
    }

    pc.onconnectionstatechange = () => {
      console.log(`${role} state:`, pc.connectionState)
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        handleEndCall()
      }
    }

    setPeerConnection(pc)
    return pc
  }

  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting")
      const stream = await initializeMedia(callType === "video")
      const pc = createPC(stream, "CALLER", currentCall.participantId, currentCall.callId)

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" })
      await pc.setLocalDescription(offer)

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall.participantId,
        callId: currentCall.callId,
      })
    } catch (err) {
      console.error("Caller init failed", err)
      setCallStatus("failed")
      setTimeout(() => handleEndCall(), 1500)
    }
  }

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting")
      const stream = await initializeMedia(callType === "video")
      const pc = createPC(stream, "RECEIVER", incomingCall.callerId, incomingCall.callId)

      // If offer already arrived before click, use it
      if (window._pendingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(window._pendingOffer))
        // add queued ICE
        for (const c of pendingIceRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
        }
        pendingIceRef.current = []

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit("webrtc_answer", {
          answer,
          receiverId: incomingCall.callerId,
          callId: incomingCall.callId,
        })
        window._pendingOffer = null
      }

      socket.emit("accept_call", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverInfo: {
          username: user.username || user.fullName,
          profilePicture: user.profilePicture || user.profilePic?.url,
        },
      })

      setCurrentCall({
        callId: incomingCall.callId,
        participantId: incomingCall.callerId,
        participantName: incomingCall.callerName,
        participantAvatar: incomingCall.callerAvatar,
      })
      clearIncomingCall()
    } catch (err) {
      console.error("Answer failed", err)
      handleEndCall()
    }
  }

  const handleRejectCall = () => {
    if (incomingCall && socket) {
      socket.emit("reject_call", {
        callerId: incomingCall.callerId,
        receiverId: user._id,
        callId: incomingCall.callId,
      })
    }
    endCall()
  }

  const handleEndCall = () => {
    const pid = currentCall?.participantId || incomingCall?.callerId
    const cid = currentCall?.callId || incomingCall?.callId
    if (pid && cid && socket) {
      socket.emit("end_call", { participantId: pid, callId: cid, duration: 0 })
    }
    localStream?.getTracks().forEach(t => t.stop())
    peerConnection?.close()
    setLocalStream(null)
    setRemoteStream(null)
    setPeerConnection(null)
    pendingIceRef.current = []
    endCall()
  }

  useEffect(() => {
    if (!socket) return

    const onAccepted = () => {
      console.log("Call accepted, creating offer...")
      setTimeout(() => initializeCallerCall(), 300)
    }

    const onRejected = () => {
      setCallStatus("rejected")
      setTimeout(() => handleEndCall(), 1500)
    }

    const onEnded = () => {
      endCall()
    }

    const onOffer = async ({ offer, senderId, callId }) => {
      console.log("Got offer", callId)
      window._pendingOffer = offer

      // If receiver already in connecting state, answer immediately
      const pc = useVideoCallStore.getState().peerConnection
      if (pc && pc.signalingState!== "closed") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          for (const c of pendingIceRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
          }
          pendingIceRef.current = []
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit("webrtc_answer", { answer, receiverId: senderId, callId })
        } catch (e) { console.error("Offer handling failed", e) }
      }
    }

    const onAnswer = async ({ answer }) => {
      const pc = useVideoCallStore.getState().peerConnection
      if (!pc || pc.signalingState === "closed") return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        for (const c of pendingIceRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
        }
        pendingIceRef.current = []
      } catch (e) { console.error("Answer set failed", e) }
    }

    const onIce = async ({ candidate }) => {
      const pc = useVideoCallStore.getState().peerConnection
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
      } else {
        pendingIceRef.current.push(candidate)
      }
    }

    socket.on("call_accepted", onAccepted)
    socket.on("call_rejected", onRejected)
    socket.on("call_ended", onEnded)
    socket.on("webrtc_offer", onOffer)
    socket.on("webrtc_answer", onAnswer)
    socket.on("webrtc_ice_candidate", onIce)

    return () => {
      socket.off("call_accepted", onAccepted)
      socket.off("call_rejected", onRejected)
      socket.off("call_ended", onEnded)
      socket.off("webrtc_offer", onOffer)
      socket.off("webrtc_answer", onAnswer)
      socket.off("webrtc_ice_candidate", onIce)
    }
  }, [socket])

  if (!isCallModalOpen &&!incomingCall) return null

  const shouldShowActive = isCallActive || ["calling", "connecting", "connected"].includes(callStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className={`relative w-full h-full max-w-4xl max-h- rounded-lg overflow-hidden ${theme === "dark"? "bg-gray-900" : "bg-white"}`}>
        {incomingCall &&!isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <img src={displayInfo?.avatar || "/placeholder.svg"} alt="avatar" className="w-32 h-32 rounded-full mb-4 object-cover" />
            <h2 className={`text-2xl font-semibold ${theme === "dark"? "text-white" : "text-gray-900"}`}>{displayInfo?.name}</h2>
            <p className="text-gray-400 mt-2">Incoming {callType} call...</p>
            <div className="flex gap-6 mt-8">
              <button onClick={handleRejectCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white"><FaPhoneSlash /></button>
              <button onClick={handleAnswerCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white"><FaVideo /></button>
            </div>
          </div>
        )}

        {shouldShowActive && (
          <div className="relative w-full h-full">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover bg-gray-800" />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                <img src={displayInfo?.avatar || "/placeholder.svg"} alt="avatar" className="w-32 h-32 rounded-full mb-4" />
                <p className="text-white text-xl">{callStatus === "calling"? `Calling ${displayInfo?.name}...` : callStatus}</p>
              </div>
            )}
            {localStream && (
              <div className="absolute top-4 right-4 w-40 h-28 rounded-lg overflow-hidden border-2 border-white bg-black">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
              {callType === "video" && (
                <button onClick={toggleVideo} className={`w-12 h-12 rounded-full ${isVideoEnabled? "bg-gray-600" : "bg-red-500"} text-white flex items-center justify-center`}>
                  {isVideoEnabled? <FaVideo /> : <FaVideoSlash />}
                </button>
              )}
              <button onClick={toggleAudio} className={`w-12 h-12 rounded-full ${isAudioEnabled? "bg-gray-600" : "bg-red-500"} text-white flex items-center justify-center`}>
                {isAudioEnabled? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>
              <button onClick={handleEndCall} className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white"><FaPhoneSlash /></button>
            </div>
          </div>
        )}

        {callStatus === "calling" && (
          <button onClick={handleEndCall} className="absolute top-4 right-4 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white"><FaTimes /></button>
        )}
      </div>
    </div>
  )
}

export default VideoCallModal