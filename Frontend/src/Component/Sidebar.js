import React, { useContext } from "react";
import "./Sidebar.css";
import Navbar from "./Navbar";
import { AuthContext } from "../Context/AuthContext";

const Sidebar = () => {
  const {user} = useContext(AuthContext);
  const u_name = user?.name || "User";
  const getInitials = (name) => {
    const nameArray = name.trim().split(" ");
    if (nameArray.length === 1){
      return nameArray[0].charAt(0).toUpperCase();
    } 
    return (nameArray[0].charAt(0) + nameArray[1].charAt(0)).toUpperCase();
  };
  return (
    <div className="sidebar_container">
      <div className="side_nav">
        <div className="logo_wrapper">
          <img src="/Assets/pms_logo.png" alt="logo" />
        </div>
        <Navbar/>
      </div>
        
      <div className="sidebar_footer">
        <div className="info_wrap">
          <div className="s_avatar">
            {getInitials(u_name)}
          </div>
          <div className="s_name_wrap">
            <h6 className="mb-0">{u_name}</h6>
            <p className="mb-0">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;