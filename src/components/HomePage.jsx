import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Layout from './Layout'
import ChatList from '../page/ChatSection/ChatList'
import useStore from '../store/layoutStore'
import { getAllUsers } from '../services/user.service'
import {getConversationsApi} from '../services/message.service'
import { useChatStore } from '../store/chatStore'
import { initializeSocket } from '../services/chat.service'

export default function HomePage() {
    const setSelectedContact = useStore((state) => state.setSelectedContact)
    const [allUsers, setAllUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const { messages, conversations, fetchConversations, initSocketListeners } = useChatStore();
    
    const getData = useCallback(async() => {
        try {
            setIsLoading(true)
            // Fetch both in parallel - conversations are now auto-created when >1 users
            const [usersResult, convsResult] = await Promise.allSettled([
                getAllUsers(),
                getConversationsApi()
            ]);

            let users = []
            if (usersResult.status === 'fulfilled') {
                const result = usersResult.value
                users = result.data || result || []
            }

            let convs = []
            if (convsResult.status === 'fulfilled') {
                const result = convsResult.value
                convs = result.data || result || []
                console.log("Conversations API:", convs.length, convs)
            }

            // Merge: conversations first (with lastMessage), then remaining users
            if (convs.length > 0) {
                const convIds = new Set(convs.map(c => c._id.toString()))
                const otherUsers = users.filter(u => !convIds.has(u._id.toString()))
                
                const otherFormatted = otherUsers.map(u => ({
                    _id: u._id,
                    fullName: u.fullName || u.username,
                    username: u.username,
                    profilePicture: u.profilePicture || u.profilePic?.url,
                    profilePic: u.profilePic,
                    about: u.about,
                    lastMessage: "Start new chat",
                    lastMessageAt: null,
                    unreadCount: 0,
                    isOnline: u.isOnline
                }))

                setAllUsers([...convs, ...otherFormatted])
            } else {
                // Fallback: no conversations yet (only 1 user in DB) - show all users
                setAllUsers(users.map(u => ({
                    _id: u._id,
                    fullName: u.fullName || u.username,
                    username: u.username,
                    profilePicture: u.profilePicture || u.profilePic?.url,
                    profilePic: u.profilePic,
                    about: u.about,
                    lastMessage: "Say hi 👋",
                    lastMessageAt: null,
                    unreadCount: 0,
                    isOnline: u.isOnline
                })))
            }
        } catch (error) {
            console.error("HomePage getData error:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        getData()
        fetchConversations()
        initializeSocket()
        initSocketListeners()
    }, [getData, fetchConversations, initSocketListeners])

    // When conversations store updates, re-merge
    useEffect(() => {
        if (conversations.length > 0) {
            getData()
        }
    }, [conversations.length])

    // Refetch when new message comes (to update lastMessage)
    useEffect(() => {
        if (messages.length) {
            fetchConversations()
            getData()
        }
    }, [messages.length])

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Loading chats...</p>
                    </div>
                ) : (
                    <ChatList contacts={allUsers} setSelectedContact={setSelectedContact} />
                )}
            </motion.div>
        </Layout>
    )
}