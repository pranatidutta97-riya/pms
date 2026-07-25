import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import './Topbar.css';
import { useOrganization } from "../Hooks/useOrganization";

const Topbar = () => {
    const {user,logout,unreadUsers,notification, showBadge, markNotificationsAsRead} = useContext(AuthContext);
    const { employees, fetchUser } = useOrganization();
    const location = useLocation();
    const navigate = useNavigate();
    const pathnames = location.pathname.split("/").filter((x) => x);
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    
    // for name initials
    const u_name = user?.name || "User";
    const getInitials = (name) => {
        const nameArray = name.trim().split(" ");
        if (nameArray.length === 1){
            return nameArray[0].charAt(0).toUpperCase();
        } 
        return (nameArray[0].charAt(0) + nameArray[1].charAt(0)).toUpperCase();
    };
    // For dropdown handling
    const [avdropdownOpen, setavdropdownOpen] = useState(false);
    const [notdropdownOpen, setnotdropdownOpen] = useState(false);
    const dropdownRef = useRef();
    const toggleDropdown = () => {
        setavdropdownOpen(!avdropdownOpen);
        setnotdropdownOpen(false);
    };
    const toggleNotfDropdown = () => {
        if(!notdropdownOpen){
            markNotificationsAsRead();
        }
        setnotdropdownOpen(!notdropdownOpen);
        setavdropdownOpen(false);
    };
    useEffect(() => {
        fetchUser();
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if(dropdownRef.current && !dropdownRef.current.contains(event.target)){
                setavdropdownOpen(false);
                setnotdropdownOpen(false);
            }
        };
        document.addEventListener("mousedown",handleClickOutside);
        return () => {
            document.removeEventListener("mousedown",handleClickOutside);
        };
    }, [])

    const handleNotificationClick = (senderId) => {
        navigate('/messages');
    };
    // for logout handling
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const totalNotificationCount = (unreadUsers?.length || 0) + (notification?.length || 0)
    
    return (
        <div className="topbar">
            <div className="topbarWrapper">
                <div className="topbar_left_breadcrumbs">
                    {pathnames.map((name, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathnames.length - 1;

                    return (
                        <span key={name} className="breadcrumb_item">
                        {isLast ? (
                            <span className="breadcrumb_active">{capitalize(name)}</span>
                        ) : (
                           <Link to={routeTo} className="breadcrumb_link">{capitalize(name)}</Link>
                        )}
                        </span>
                    );
                    })}
                </div>
                <div className="topRight" ref={dropdownRef}>
                    <div className="topbarIconContainer">
                        <div className="s_avatar" onClick={toggleDropdown}>
                            {getInitials(u_name)}
                        </div>
                        <div>
                            {avdropdownOpen && (
                            <div className="profile_dropdown">
                                <div className="dropdown_item">
                                    <h6 className="mb-0">{u_name}</h6>
                                    <p>{user?.role}</p>
                                </div>
                                <div className="dropdown_item">Settings</div>
                                <hr />
                                <div className="dropdown_item logout_btn" onClick={handleLogout}>Logout <i class="fas fa-right-to-bracket"></i></div>
                            </div>
                        )}
                        </div>
                        
                        
                        <div className="notification_panel" onClick={toggleNotfDropdown}>
                            <i class="fas fa-bell"></i>
                            {showBadge && totalNotificationCount > 0 && (
                                <span className="topbar_noti_badge">{totalNotificationCount}</span>
                            )}
                        </div>
                        <div>
                            {notdropdownOpen && (
                            <div className="notification_dropdown">
                                
                                <div className="dropdown_head">
                                    <h6 className="mb-0">Messages ({unreadUsers?.length || 0})</h6>
                                </div>
                                {unreadUsers && unreadUsers.length > 0 ? (
                                    unreadUsers.map((senderId) => {
                                        const sender = employees?.find(emp => String(emp._id || emp.id) === String(senderId));
                                        const senderName = sender ? sender?.name : 'User';
                                        return (
                                            <div key={senderId} className="dropdown_item unread_noti_item" onClick={() => handleNotificationClick(senderId)}>
                                                <i className="fas fa-comment-dots text-primary me-2"></i>
                                                <span><strong>{senderName}</strong> sent you a message</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="dropdown_item textMuted text-center">No new messages</div>
                                )}

                                <hr className="my-1" />

                                <div className="dropdown_head">
                                    <h6 className="mb-0">Team Activity ({notification?.length || 0})</h6>
                                </div>
                                {notification && notification.length > 0 ? (
                                    notification.map((noti, index) => (
                                        <div key={index} className="dropdown_item status_noti_item">
                                            {noti.type === 'login' ? (
                                                <i className="fas fa-circle-check text-success me-2"></i>
                                            ) : (
                                                <i className="fas fa-right-from-bracket text-danger me-2"></i>
                                            )}
                                            <span>{noti.message}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="dropdown_item textMuted text-center">No recent activity</div>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Topbar;