import React, { useEffect, useState } from "react";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from "recharts";
const BASE_URL = process.env.REACT_APP_BASE_URL;
const Charts = ({ teamId, userId }) => {

  const [barData, setbarData] = useState([]);
  const [pieData, setpieData] = useState([]);

  const [areaData, setareaData] = useState([]);
  const fetchChartData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chart/resource-utilization/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setareaData(data);
        console.log(data); 
      }
      const resPie = await fetch(`${BASE_URL}/chart/get-project-status/${userId}`);
      if (resPie.ok) {
        const data = await resPie.json();
        setpieData(data); 
      }
      const resBar = await fetch(`${BASE_URL}/chart/weekly-hours/${userId}`);
      if(resBar.ok){
        const data = await resBar.json();
        setbarData(data);
        console.log(data);
      }
    } catch (error) {
      console.error("Chart data error:", error);
    } 
  };

  useEffect(() => {
    fetchChartData();
  }, [teamId, userId]);


  const COLORS = ['#34D399', '#fbbf24', '#60a5fa', '#F87171'];

  return (
    <div className="charts_container">
        <div className="boxCard">
            <h4>Weekly Hours Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                <CartesianGrid strokeDasharray="1 1" stroke="#ffffff" opacity={0.1}/>
                <XAxis dataKey="name" />
                <YAxis />
                <Legend />
                <Bar dataKey="hours" fill="#a78bfa" barSize={15} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      
        <div className = "boxCard">
            <h4>Task Status Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <Pie
                    data={pieData}
                    cx="35%"
                    cy="50%"
                    labelLine={true}
                    innerRadius={72} 
                    outerRadius={90} 
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="status"
                >
                    {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle"iconSize={10}wrapperStyle={{ paddingLeft: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>

        <div className = "boxCard">
            <h4>Resource Utilization Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                
                <defs>
                    <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInternal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.4} />
                
                <XAxis dataKey="month" stroke="#8a92a6" fontSize={12} tickLine={false} />
                <YAxis stroke="#8a92a6" fontSize={12} tickLine={false} allowDecimals={false} />
                
                <Tooltip 
                    contentStyle={{ 
                    backgroundColor: "#111827", 
                    borderColor: "#1f2937", 
                    borderRadius: "8px",
                    color: "#fff" 
                    }} 
                />
                <Legend verticalAlign="top" height={40} iconType="circle" />

                <Area 
                    type="monotone" 
                    dataKey="Billable" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorBillable)" 
                />
                
                <Area 
                    type="monotone" 
                    dataKey="Internal" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorInternal)" 
                />

                </AreaChart>
            </ResponsiveContainer>        
        </div>
    </div>
  );
};

export default Charts;