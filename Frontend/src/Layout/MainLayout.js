import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Component/Sidebar";
import Topbar from "../Component/Topbar";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="main_layout">
        <div className="m_sidebar">
            <Sidebar />
        </div>
        <div className="main_content">
            <Topbar />
            <div className="content">
                <Outlet />
            </div>
        </div>    
    </div>
  );
};
export default MainLayout;
