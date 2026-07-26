import React, { useContext, useEffect, useState } from "react";
import { useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './chatbot.css';
import { AuthContext } from "../Context/AuthContext";
import { useOrganization } from "../Hooks/useOrganization";

const Chatbot = () => {
    const [inputValue, setInputValue] = useState(''); 
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const bottomRef = useRef(null);
    const {employees, fetchUser} = useOrganization();
    const {user, unreadUsers, setUnreadUsers, onlineUsers, globalMessages, setglobalMessages, socket, currentUserId} = useContext(AuthContext);
    const [selectedUser, setselectedUser] = useState(null);
    
    const currentUserName = (user && user.name) || 'Guest';
    
    useEffect(() => {
        if (fetchUser) fetchUser();
    }, []); 

    useEffect(() => {
        if(!socket) return;
        
        socket.on('chat_history_response', (historyData) => {
            console.log("📜 Chat history loaded:", historyData);
            setglobalMessages(historyData); 
        });
       
        return () => {
            socket.off('chat_history_response');
        };
    }, [socket, setglobalMessages]);

    useEffect(() => {
        const targetId = selectedUser?._id || selectedUser?.id;
        if (!targetId) return;
        const hasUnread = unreadUsers?.includes(targetId);
        const hasNewMessageFromSelected = globalMessages.some(
            msg => msg.sender_id === targetId && unreadUsers.includes(targetId)
        );
        if (hasUnread && hasNewMessageFromSelected) {
            setUnreadUsers(prev => prev.filter(id => id !== targetId));
        }
    },[globalMessages, selectedUser, unreadUsers, setUnreadUsers])
        
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [globalMessages]);

    const getInitials = (name) => {
        if(!name) return 'U';
        const nArr = name.trim().split(" ")
        if (nArr.length === 1) {
            return nArr[0][0].toUpperCase()
        }
        return (nArr[0][0] + nArr[1][0]).toUpperCase()
    }
    const formatMessageTime = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString; 
            
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return isoString;
        }
    };
    const formatMessageDate = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString;

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString(); // Format as per your preference
            }
        } catch (e) {
            return isoString;
        }
    };
    const handleEmojiClick = (emojiData) => {
        setInputValue(prev => prev + emojiData.emoji);
    }
    const handleSend = (e) => {
        if (e) e.preventDefault();

        if (inputValue.trim() !== '') {
            const msgData = {
                sender_id: currentUserId,
                receiver_id: selectedUser._id || selectedUser.id,
                name: currentUserName,
                sender: getInitials(currentUserName), 
                text: inputValue,      
                time: new Date().toISOString()
            };

            socket.emit('private_message', msgData);
            setInputValue(''); 
            setShowEmojiPicker(false);
        }
    };
    const handleChatUser = (employee) => {
        setselectedUser(employee);
        const empId = employee._id || employee.id;
        setUnreadUsers(prev => prev.filter(id => id !== employee._id));
        setglobalMessages([]);
        
        if (currentUserId && empId && socket) {
        socket.emit('get_chat_history', {
            sender_id: currentUserId,
            receiver_id: empId
        });
    }
    }
    const selectedName = selectedUser?.name;
    const filteredMessages = globalMessages.filter(msg => {
        const targetId = selectedUser?._id || selectedUser?.id;
        return (
            (msg.sender_id === currentUserId && msg.receiver_id === targetId) ||
            (msg.sender_id === targetId && msg.receiver_id === currentUserId)
        );
    });
    

    return (
        <div className="chat-container mt-5">
            <div className="chatBox_wrap">
                <div className="chat_rail">
                    <div className="chat_rail_head">
                        <h5>Single Chat</h5>
                    </div>
                    <div className="chat_list">
                        {employees && employees.filter(employee => (employee._id || employee.id) !== currentUserId).map((employee) => {
                            const empId = employee._id || employee.id;
                            const isOnline = onlineUsers.includes(empId);
                            const isSelected = selectedUser?._id === empId;
                            const unreadCount = unreadUsers.filter(id => id === empId).length
                            const isUnread = unreadCount > 0;
                            return (
                            <div key={employee._id || employee.id} className={`chat_list_item ${isSelected ? 'active' : ''}`} onClick={() => handleChatUser(employee)}>
                                <div className="chat_list_item_img">
                                    {getInitials(employee.name)}
                                    <span className={`status_indicator ${isOnline ? 'online' : 'offline'}`}></span>
                                </div>
                                <div className="chat_list_item_detail">
                                    <h6 className="mb-0">{employee.name}</h6>
                                    <p className="mb-0">{isOnline ? "Online" : "Offline"}</p>
                                    {isUnread && (<span className="noti_badge">{unreadCount}</span>) }
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
                <div className="chat_pane">
                    { selectedUser ? (
                        <div className="active-chat-wrapper" key={selectedUser?._id || selectedUser?.id}>
                            <div className="chat_pane_head">
                                <div className="chat_list_item">
                                    <div className="chat_list_item_img">
                                        {getInitials(selectedName)}
                                    </div>
                                    <div className="chat_list_item_detail">
                                        <h6 className="mb-0">{selectedName}</h6>
                                        {onlineUsers?.includes(selectedUser?._id || selectedUser?.id) ? <span className="online-badge">Online</span> : <span className="offline-badge">Offline</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="chat-box">
                                {(filteredMessages || []).map((msg, index) => {
                                    const currentMsgDateStr = msg.time ? new Date(msg.time).toDateString() : '';
                                    const prevMsgDateStr = index > 0 && filteredMessages[index - 1].time 
                                        ? new Date(filteredMessages[index - 1].time).toDateString() 
                                        : '';
                                        const showDateHeader = currentMsgDateStr !== prevMsgDateStr;
                                    return (
                                        <div key={index}>  
                                            {showDateHeader &&(
                                                <div className="chat_date_header">
                                                    <span className="chatDate">{formatMessageDate(msg.time)}</span>
                                                </div>
                                            )}
                                            <div className={`chat-msg ${currentUserId === msg.sender_id ? 'me' : 'others'}`}>
                                                <div className="chat-msg-av ma-2">{msg.sender}</div>
                                                <div className="chat-msg-stack">
                                                    <div className="chat-bub">{msg.text}</div>
                                                    <div className="chat-msg-meta">{formatMessageTime(msg.time)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        );
                                })}
                                <div ref={bottomRef} />
                            </div>
                            <form onSubmit={handleSend}>
                                <div className="chat-msg-sender">
                                    <button type="button" className="emoji-btn" onClick={() => {setShowEmojiPicker(!showEmojiPicker);}}>
                                        <i className="far fa-smile"></i>
                                        {showEmojiPicker && (
                                            <div className="emoji-picker-wrapper">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" height={350} width={400} />
                                            </div>
                                        )}
                                    </button>
                                    <input 
                                        type="text" 
                                        value={inputValue} // State mapping fixed
                                        onChange={(e) => setInputValue(e.target.value)} 
                                        placeholder={`Type a message to ${selectedName}...`}
                                        onFocus={() => setShowEmojiPicker(false)}
                                    />
                                    <button type="submit"><i className="fas fa-paper-plane"></i></button>
                                </div>
                            </form>
                        </div>
                    ):(
                        <div className="no-chat-selected-wrapper">
                            <div className="empty-state-content">
                                <div className="empty-state-icon-box">
                                    <i className="far fa-comment"></i>
                                </div>
                                <h2>Welcome to Team Chatroom</h2>
                                <p>Select a teammate from the left sidebar to start a secure private conversation.</p>
                                <div className="empty-state-badges">
                                    <span><i className="fas fa-circle online-dot"></i> Real-time</span>
                                    <span><i className="fas fa-shield-halved"></i> End-to-End</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                </div>
            </div>
        </div>    
    );
};

export default Chatbot;