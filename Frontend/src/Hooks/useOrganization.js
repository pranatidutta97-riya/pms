import React, { useState } from "react";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const useOrganization = () => {
    const [teams, setteams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [attandanceData, setattandanceData] = useState(null);
    const [weeklyData, setweeklyData] = useState(null);

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${BASE_URL}/user/get-teams`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setteams(data);
        } catch (error) {
            console.log("Fetch Teams Error:", error);
        }
    }
    const fetchUser = async () => {
        try {
            const response = await fetch(`${BASE_URL}/user/get-users`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setEmployees(data.employees);
        } catch (error) {
            console.log(error);
        }
    }
    const deleteUser = async (userId) => {
        try{
            const response = await fetch(`${BASE_URL}/user/delete-user`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({user_id: userId})
            });
            const data = await response.json();
            console.log(data);
            return data;
        }catch{
            console.log("Error deleting user");
            return { error: "Failed to delete user" };
        }
    }
    const createTeam = async (teamName) => {
        try{
            const response = await fetch(`${BASE_URL}/user/create-team`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    team_name: teamName,
                })
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.error || "Failed to create team" };
            }

            await fetchTeams(); 
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
            console.log(error)
        }
        
    }
    const updateTeam = async (teamId, newTeamName) => {
        try{
            const response = await fetch(`${BASE_URL}/user/update-team`, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    team_id: teamId,
                    newteamName: newTeamName
                })
            });
            const data = await response.json();
            
            if (!response.ok) {
                return { success: false, error: data.error || "Failed to update team" };
            }
            else{
                return { success: true, data };
                alert("Team Updated Successfully")
                console.log(data)
                await fetchTeams();
            }
            
        }catch(error) {
            console.log(error)
        }
    }
    const assignUser = async ({userId, role, teamId, managerId}) => {
        try {
            const response = await fetch(`${BASE_URL}/user/assign-user`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    user_id: userId,
                    role: role,
                    team_id: teamId || null,
                    manager_id: managerId || null 
                })
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    }
    const getattandance = async (userId) => {
        try{
            const response = await fetch(`${BASE_URL}/user/get-working-status`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({user_id: userId})
            });
            const data = await response.json();
            if (response.ok) {
                setattandanceData(data);
                // console.log(data); 
            }
            
        } catch (error) {
            console.log("Attandance fetch error",error);
        }
    }
    const weeklyWorkingHours = async (userId) => {
        try{
            const response = await fetch(`${BASE_URL}/user/weekly-working-hours`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({user_id: userId})
            });
            const data = await response.json();
            if(response.ok) setweeklyData(data);
            // console.log(data);
        } catch (error) {
            console.log(error);
        }
    }

    return { teams, employees, fetchTeams, fetchUser, assignUser, createTeam, updateTeam, getattandance, attandanceData, weeklyWorkingHours, deleteUser, weeklyData};

}
