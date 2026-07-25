import React, { createContext, useEffect } from "react";
import { useState } from 'react';
import io from 'socket.io-client';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [unreadUsers, setUnreadUsers] = useState([]);
    const [socket, setsocket] = useState(null)
    const [globalMessages, setglobalMessages] = useState([]);
    const [onlineUsers, setonlineUsers] = useState({});
    const [notification, setnotification] = useState([]);
    const [showBadge, setshowBadge] = useState(false);

    const savedUser = localStorage.getItem('user')
    useEffect(() => {
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, [savedUser])

    const currentUserId = user?._id || user?.id;
    useEffect(() => {
        if(!currentUserId) {
            return;
        }
        const newsocket = io('http://mayurpankhi:9005');
        setsocket(newsocket);

        newsocket.on('connect', () => {
            console.log('Connected to socket server');
            newsocket.emit('go_online', { user_id: currentUserId })
        });
        
        newsocket.on('online_status_change', (onlineUsersObj) => {
            setonlineUsers(onlineUsersObj || {});
        });

        newsocket.on('user_status_notification', (data) => {
            console.log("📩 Notification received:", data);
            setnotification(prev => [...prev, data]);
            setshowBadge(true);
        })

        newsocket.on('message', (data) => {
            console.log("📩 Global real-time message received:", data);
            setglobalMessages(prev => [...prev, data]);
            if (data.sender_id !== currentUserId) {
                setUnreadUsers(prev => [...prev, data.sender_id])
                setshowBadge(true);
            }
            
        })
        newsocket.on('unread_notifications_on_login', (senderIds) => {
            console.log("📩 Offline notifications received from backend:", senderIds);
            setUnreadUsers(prev => {
                const combined = [...prev, ...senderIds];
                return [...new Set(combined)];
            });
        });
        
        return () => {
            newsocket.off('unread_notifications_on_login');
            newsocket.off('message');
            newsocket.disconnect();
        };
    }, [currentUserId])
    
    const markNotificationsAsRead = () => {
        setshowBadge(false); 
    }
    const toggleBreakStatus = (isOnBreak) => {
        if (socket && currentUserId) {
            socket.emit('toggle_break', { user_id: currentUserId, is_on_break: isOnBreak });
        }
    }
    const getInitials = (name) => {
        const nameArray = name.trim().split(" ");
        if (nameArray.length === 1){
            return nameArray[0].charAt(0).toUpperCase();
        } 
        return (nameArray[0].charAt(0) + nameArray[1].charAt(0)).toUpperCase();
    };
    const logout = () => {
        if (socket && currentUserId) {
            socket.emit('go_offline', { user_id: currentUserId });
        }
        setnotification([]);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setsocket(null);
    }
    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (socket) {
            socket.emit('go_online', { user_id: userData._id || userData.id });
        }
    } 

    return (
            <AuthContext.Provider value={{user, login, logout, unreadUsers, currentUserId, setUnreadUsers, onlineUsers, globalMessages, setglobalMessages, notification, socket, showBadge, markNotificationsAsRead, toggleBreakStatus, getInitials}}>{children}</AuthContext.Provider>
    );
};
export default AuthProvider;