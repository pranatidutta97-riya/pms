import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { AuthContext } from "../Context/AuthContext";

const Navbar = () => {
  const {unreadUsers, user} = useContext(AuthContext);
  const currentUserRole = user?.role;
  return (
    <div className="navbr">
      <ul className="nav_list">
        <li>
            <NavLink to="/dashboard"><i className="fas fa-home"></i>Dashboard</NavLink>
        </li>
        <li>
            <NavLink to="/projects"><i className="fas fa-folder-open"></i>Projects</NavLink>
        </li>
        <li>
            <NavLink to="/tasks"><i className="fas fa-folder-open"></i>My Tasks</NavLink>
        </li>
        {currentUserRole === "Admin" && (
            <li>
              <NavLink to="/teams"><i className="fas fa-users"></i>Teams</NavLink>
          </li>
        )}
        <li>
            <NavLink to="/messages"><i className="far fa-comment"></i>{unreadUsers.length > 0 && <span className="notification-badge">{unreadUsers.length}</span>}Messages</NavLink>
        </li>
        
      </ul>
    </div>
  );
};
export default Navbar;