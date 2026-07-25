import React, { useContext, useEffect, useState } from "react";
import { useProjectdata } from "../Hooks/useProjectdata";
import { AuthContext } from "../Context/AuthContext";
import './TaskDetails.css';

const TaskDetails = ({ task, projects, members }) => {
    const { fetchTasks, timeLogs, updateTask, totaltimeLog, comments, fetchComments, addComment} = useProjectdata(); 
    const { user } = useContext(AuthContext);
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [assignedUsersList, setAssignedUsersList] = useState([]); 

    const currentUserId = user?.id || user?._id;
    const isManager = user?.role === "Manager" || user?.role === "Admin"; 
    const [Task, setTask] = useState(task?.assigned_users || []);
    const [formData, setFormData] = useState({ hours: '' });
    const [commentForm, setcommentForm] = useState({ comment: '' });

    useEffect(() => {
        if (task?.assigned_users) {
            const initialUserIds = task.assigned_users.map(u => String(u._id || u.id));
            setAssignedUsersList(initialUserIds);
            setTask(task.assigned_users);
        }
    }, [task]);
    console.log(assignedUsersList)

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (task?._id || task?.id) {
            const taskId = task._id || task.id;
            fetchComments(taskId);
        }
    }, [task?._id || task?.id]);

    if (!task) return null;

    const currentProject = projects?.find(p => String(p._id || p.id) === String(task?.project_id));
    const projectName = currentProject?.project_title || currentProject?.title || "Unknown Project";

    const hanleInput = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const hanleComment = (e) => {
        const { name, value } = e.target;
        setcommentForm({ ...commentForm, [name]: value });
    };

    const handleEmployeeCheckboxChange = (e) => {
        const userId = String(e.target.value);
        if (e.target.checked) {
            setAssignedUsersList(prev => [...prev, userId]); 
        } else {
            setAssignedUsersList(prev => prev.filter(id => id !== userId)); 
        }
    };

    const handleSaveAssignedMembers = async () => {
        try {
            const taskId = task._id || task.id;
            const cleanUserIds = assignedUsersList.map(item => 
                typeof item === 'object' ? (item._id || item.id) : item
            );
            await updateTask({taskId, assigned_users: cleanUserIds });
            const updatedUsersObjects = members.filter(emp => 
                cleanUserIds.includes(String(emp._id || emp.id))
            );

            setTask(updatedUsersObjects);
            // setTask(prevTask => ({
            //     ...prevTask,
            //     assigned_users: assignedUsersList 
            // }));
            setIsDropdownOpen(false);
            fetchTasks(); 
        } catch (error) {
            console.error("Failed to update assigned users", error);
        }
    };

    const updateTasktime = async () => {
        await updateTask({taskId: task._id, userId: currentUserId, hours: formData.hours});
        setFormData({ hours: '' });
        fetchTasks();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addComment(task._id, currentUserId, commentForm.comment);
        setcommentForm({ comment: '' });
        fetchComments(task._id);
    };

    const displayLogs = (timeLogs[task?._id || task?.id] || task?.time_logs || []).map(log => ({
        ...log,
        user_name: log.user_name || task?.assigned_users?.find(u => String(u._id || u.id) === String(log.user_id))?.name || "Unknown User"
    }));

    const displayTotalTime = totaltimeLog[task?._id || task?.id] || task?.total_logged_hours || 0;

    const getInitials = (name) => {
        if (!name) return "U";
        const nameArray = name.trim().split(" ");
        if (nameArray.length === 1) {
            return nameArray[0].charAt(0).toUpperCase();
        }
        return (nameArray[0].charAt(0) + nameArray[1].charAt(0)).toUpperCase();
    };

    const currentTaskComment = comments[task?._id] || [];

    return (
        <>
            <div className="modal-header">
                <h4 className="modal-title fs-5" id="taskDetailModalLabel">Details of {task?.task_name}</h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-5 textMuted">
                            <div className="task_detail">
                                <div className="table_item"><b>Project:</b> {projectName}</div>
                                <div className="table_item"><b>Task Status:</b> {task?.status}</div>
                                <div className="table_item"><b>Description:</b> {task?.description}</div>
                                
                                <div className="table_item position-relative">
                                    <b>Assigned Users:</b>
                                    <div className="assignee_box my-2">
                                        {Task.map((user, index) => (
                                            <span key={index} className="avatar-circle me-1" title={user.name || user}>
                                                {getInitials(user.name || "User")}
                                            </span>
                                        ))}
                                    </div>

                                    {isManager && (
                                        <div className="mt-2">
                                            <button 
                                                type="button" 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            >
                                                <i className="fas fa-edit me-1"></i> Edit Members
                                            </button>

                                            {isDropdownOpen && (
                                                <div className="shadow bg-white position-absolute w-100 p-2 rounded" 
                                                     style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", top: "100%", left: 0 }}>
                                                    
                                                    {members && members.length > 0 ? (
                                                        members.map((emp) => {
                                                            const empId = String(emp._id || emp.id);
                                                            const isChecked = assignedUsersList.includes(empId);

                                                            return (
                                                                <div className="form-check my-1" key={empId}>
                                                                    <input 
                                                                        className="form-check-input" 
                                                                        type="checkbox" 
                                                                        value={empId} 
                                                                        id={`emp_${empId}`} 
                                                                        checked={isChecked}
                                                                        onChange={handleEmployeeCheckboxChange} 
                                                                    />
                                                                    <label className="form-check-label text-dark" htmlFor={`emp_${empId}`} style={{ cursor: "pointer" }}>
                                                                        {emp.name}
                                                                    </label>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-muted text-center py-1">No members found</div>
                                                    )}

                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm global_btn w-100 mt-2"
                                                        onClick={handleSaveAssignedMembers}
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="table_item log-input d-flex align-items-center mt-3">
                                    <label htmlFor="hours" className="me-2">Log Time:</label>
                                    <input type="number" className="form-control form-control-sm me-2" name="hours" value={formData.hours || ''} placeholder="Hours" onChange={hanleInput} />
                                </div>

                                {displayLogs && displayLogs.length > 0 ? (
                                    <div className="table_item mt-2">
                                        {displayLogs.map((log, index) => (
                                            <p key={index} className="mb-1 text-secondary">
                                                <b>{log.hours} hours</b> by <span className="text-light">{log.user_name}</span>
                                            </p>
                                        ))}
                                        <p className="mt-2"><b>Total time Spent:</b> <span className="badge bg-secondary fs-6">{displayTotalTime} hours</span></p>
                                    </div>
                                ) : (
                                    <div className="table_item mt-3">
                                        <p className="textMuted">No time logged yet.</p>
                                        <p><b>Total time Spent:</b> <span className="badge bg-secondary fs-6">{displayTotalTime || 0} hours</span></p>
                                    </div>
                                )}

                                <div className="modal-footer px-0 pb-0">
                                    <button type="button" className="btn global_btn" onClick={updateTasktime}>Log Time</button>
                                </div>
                            </div>
                        </div>    

                        <div className="col-md-7 textMuted">
                            <div className="task_comments">
                                <div className="comments_header"><h5>Activity</h5></div>
                                <div className="comment_activity">
                                    {currentTaskComment && currentTaskComment.length > 0 ? (
                                        currentTaskComment.map((comment, index) => (
                                            <div className="comment_item mb-2" key={index}>
                                                <div className="comment_user">
                                                    <div className="user_header d-flex justify-content-between">
                                                        <div className="comment_userName">
                                                            <span className="comment_avatar me-2">{getInitials(comment.commented_by_name)}</span>
                                                            <span className="comment_user_name me-2">{comment.commented_by_name}</span>
                                                        </div>
                                                        <div className="comment_time">
                                                            <span className="sm_badge violet_badge">{new Date(comment.commented_at).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="comment_cont mt-1">
                                                        <p className="mb-0">{comment.comment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="textMuted text-center py-3">No comments yet.</p>
                                    )}
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="comment_bar d-flex mt-2">
                                        <textarea id="commentTxt" name="comment" className="form-control me-2" value={commentForm.comment} placeholder="Write a comment..." onChange={hanleComment}></textarea>
                                        <button type="submit" className="btn global_btn"><i className="fas fa-paper-plane"></i></button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaskDetails;