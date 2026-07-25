import React, { useState } from "react";
import { useRevalidator } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const useProjectdata = () => {
    const [projects, setprojects] = useState([]);
    const [tasks, settasks] = useState([]);
    const [timeLogs, settimeLogs] = useState({});
    const [totaltimeLog, settotaltimeLog] = useState({});
    const [comments, setcomments] = useState({})
    const fetchProjects = async () => {
        try {
            const response = await fetch(`${BASE_URL}/project/get-project`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setprojects(data);
        } catch (error) {
            console.log("Fetch Projects Error:", error);
        }
    }
    
    const createProject = async (projectData) => {
        try {
            const response = await fetch(`${BASE_URL}/project/create-project`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(projectData)
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log("Add Project Error:", error);
        }
    }
    const updateProject = async (projectId, projectData) => {
        try{
            const response = await fetch(`${BASE_URL}/project/update-project`, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({project_id: projectId, ...projectData})
            });
            const data = await response.json();
            console.log(data);
        } 
        catch (error) {
            console.log("Update Project Error:", error);
        }
    }
    
    
    const createTask = async (taskData) => {
        try {
            const response = await fetch(`${BASE_URL}/project/create-task`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log("Add Task Error:", error);
        }
    }
    const fetchTasks = async () => {
        try {
            const response = await fetch(`${BASE_URL}/project/get-tasks`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            settasks(data);
        } catch (error) {
            console.log("Fetch Tasks Error:", error);
        }
    }
    const updateTask = async ({taskId, userId = null, hours = null, assigned_users = null}) => {
        try {
            const response = await fetch(`${BASE_URL}/project/update-task`, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ task_id: taskId, user_id: userId, hours: hours, assigned_users: assigned_users })
            });
            const data = await response.json();
            settimeLogs(prev => ({...prev, [taskId]: data.time_logged_list}));
            settotaltimeLog(prev => ({...prev, [taskId]: data.total_logged_hours}));
            console.log(data, timeLogs);
        } catch (error) {
            console.log("Update Task Status Error:", error);
        }
        
    }
    const updateTaskStatus = async (taskId, status) => {
        try {
            const response = await fetch(`${BASE_URL}/project/update-task-status`, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ task_id: taskId, status: status })
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log("Update Task Status Error:", error);
        }
    }
    const addComment = async (taskId, userId, comment) => {
        try{
            const response = await fetch(`${BASE_URL}/project/add-task-comment`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ task_id: taskId, commented_by: userId, comment: comment })
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.log("Add Comment Error:", error);
        }
    }
    const fetchComments = async (taskId) => {
        try{
            const response = await fetch(`${BASE_URL}/project/get-task-comments/${taskId}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setcomments(prev => ({...prev, [taskId]: data}));
            console.log(data);
        } catch (error) {
            console.log("Fetch Comments Error:", error);
        }
    }

    return { projects, fetchProjects, updateProject, createProject, tasks, createTask, fetchTasks, updateTaskStatus, timeLogs, updateTask, totaltimeLog, comments, fetchComments, addComment };
}