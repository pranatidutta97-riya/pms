import React, { useEffect, useState, useMemo, useContext } from "react"; 
import "./Tasks.css";
import { useProjectdata } from "../../Hooks/useProjectdata";
import ProjectCards from "../../Component/ProjectCards";
import { useOrganization } from "../../Hooks/useOrganization";
import { useLocation } from "react-router-dom";
import TaskDetails from "../../Component/TaskDetails";
import { AuthContext } from "../../Context/AuthContext";

const Tasks = () => {
    const { employees, fetchUser } = useOrganization();
    const { projects, fetchProjects, tasks, createTask, fetchTasks, updateTaskStatus } = useProjectdata();
    const location = useLocation();
    
    const passedProjectId = location.state?.selectedProjectId || '';
    const { user } = useContext(AuthContext);
    const [selectedProject, setSelectedProject] = useState(passedProjectId);
    const [selectedTask, setselectedTask] = useState(null);
    const [formdata, setFormdata] = useState({
        tasktitle: "",
        taskdesc: "",
        taskpriority: "",
        taskdeadline: "",
        taskstatus: "To Do",
        assignedusers: [],
        timelogged: 0.0
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const currentUserTeam = user?.team_id;
    const currentUserType = user?.role;
    const currentUserID = user?._id || user?.id;
    useEffect(() => {
        fetchProjects();
        fetchUser();
        fetchTasks();
    }, [selectedTask]);

    useEffect(() => {
        if (location.state?.selectedProjectId) {
            setSelectedProject(location.state.selectedProjectId);
        }
    }, [location.state]);

    const filterTasks = (status) => {
        return tasks?.filter(task => {
            const matchesStatus = task.status === status;
            const taskprojectId = task?.project_id;
            const assignedMember = task.assigned_users?.some((user) => (user._id || user.id) === currentUserID);
            const userRole = (currentUserType === ("Manager" || "Admin")) ? 'true' : assignedMember
            const matchesProject = selectedProject ? String(taskprojectId) === String(selectedProject) : true; 
            return matchesStatus && matchesProject && userRole;
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormdata(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    const currentProjectObj = projects.find(p => String(p._id || p.id) === String(selectedProject));
    const filteredEmployees = useMemo(() => {
      if (!selectedProject || !employees || !projects) return [];

      const assignedTeams = currentProjectObj?.team_ids || [];

      if (assignedTeams.length === 0) return [];

      return employees.filter(emp => {
          const empRole = emp?.role
          const empTeamId = emp?.team_id;
          if (!empTeamId) return false;

          // match with project's assignedTeams and user team
          return assignedTeams.some(teamId => {
              const cleanTeamId = teamId && typeof teamId === 'object' ? (teamId._id || teamId.id) : teamId;
              return (String(cleanTeamId) === String(empTeamId)) && (empRole === "Employee");
          });
      });
    }, [selectedProject, employees, projects]); 


    useEffect(() => {
        if (selectedProject) {
            console.log("selected project:", selectedProject);
            console.log("FilteredEmployee:", filteredEmployees);
        }
    }, [filteredEmployees, selectedProject]);


    const handlecreateTask = async () => {
        const taskData = {
            task_title: formdata.tasktitle,
            description: formdata.taskdesc,
            priority: formdata.taskpriority,
            deadline: formdata.taskdeadline,
            status: formdata.taskstatus,
            assigned_users: formdata.assignedusers,
            time_logged: Number(formdata.timelogged),
            project_id: selectedProject
        };
        await createTask(taskData);
        setFormdata({
            tasktitle: "",
            taskdesc: "",
            taskpriority: "",
            taskdeadline: "",
            taskstatus: "To Do",
            assignedusers: [],
            timelogged: 0.0
        });
        setIsDropdownOpen(false);
        fetchTasks();
    };

    const handleEmployeeCheckboxChange = (e) => {
        const { value, checked } = e.target;
        const employeeId = value;

        setFormdata(prevState => {
            if (checked) {
                return {
                    ...prevState,
                    assignedusers: [...prevState.assignedusers, employeeId]
                };
            } else {
                return {
                    ...prevState,
                    assignedusers: prevState.assignedusers.filter(id => id !== employeeId)
                };
            }
        });
    };
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            await updateTaskStatus(taskId, newStatus); 
            fetchTasks();
        }
        
    };
    const openTaskModal = (task) => {
        setselectedTask(task);
        const modal = new window.bootstrap.Modal(document.getElementById('taskDetailModal'));
        modal.show();
        // console.log("Selected task:", task);
    };
    
    const filteredProjects = projects.filter((project) => {
        if (currentUserType === "Admin") return true;
        const projectTeams = project.team_ids || [];
        return currentUserTeam ? projectTeams.some(team => (team._id || team.id) === currentUserTeam) : true;
    })
    
    return (
        <div>
            <h1>Tasks</h1>

            <div className="d-flex justify-content-between align-items-center">
                <div className="px-3">
                    <label className="form-label fw-bold">Select Project:</label>
                    <select className="form-select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                        <option value="">-- All Projects --</option>
                        {filteredProjects && filteredProjects?.map((proj) => {
                            const id = proj._id || proj.id;
                            return (
                                <option key={id} value={id}>
                                    {proj.project_title || proj.title}
                                </option>
                            );
                        })}
                    </select>
                </div>
                {currentUserType === ("Manager" || "Admin") &&
                    <div>
                        <button type="button" className="btn global_btn" data-bs-toggle="modal" data-bs-target="#createTaskModal">
                            <i className="fas fa-plus"></i> Create Tasks
                        </button>
                        
                        <div className="modal fade" id="createTaskModal" tabIndex="-1" aria-labelledby="createTaskModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title fs-5" id="createTaskModalLabel">Create Task for {currentProjectObj?.project_title}</h4>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                <div className="mb-3">
                                    <label htmlFor="tasktitle" className="col-form-label">Task Title:</label>
                                    <input type="text" name="tasktitle" value={formdata?.tasktitle || ""} className="form-control" id="tasktitle" onChange={handleInputChange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="taskdesc" className="col-form-label">Task Description:</label>
                                    <textarea name="taskdesc" value={formdata?.taskdesc || ""} className="form-control" id="taskdesc" onChange={handleInputChange} />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="taskpriority" className="col-form-label">Task Priority:</label>
                                    <select name="taskpriority" value={formdata?.taskpriority || ""} className="form-control" id="taskpriority" onChange={handleInputChange} >
                                    <option value="">Select Priority</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="mb-3 me-2">
                                    <label htmlFor="taskdeadline" className="col-form-label">Task Deadline:</label>
                                    <input type="date" name="taskdeadline" value={formdata?.taskdeadline || ""} className="form-control" id="taskdeadline" onChange={handleInputChange} />
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="mb-3 me-3">
                                    <label htmlFor="taskstatus" className="col-form-label">Task Status:</label>
                                    <input type="text" name="taskstatus" value={formdata?.taskstatus || ""} className="form-control" id="taskstatus" onChange={handleInputChange} />
                                    </div>
                                    <div className="mb-3 position-relative" style={{ width: '100%' }}>
                                    <label htmlFor="assignedusers" className="col-form-label">Task Assigned:</label>
                                        <div className="form-select d-flex justify-content-between align-items-center" 
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: "pointer" }}>
                                            <span className="text-truncate">
                                                {formdata.assignedusers.length === 0 
                                                    ? "Select Team Members" 
                                                    : `${formdata.assignedusers.length} Member(s) Selected`}
                                            </span>
                                            <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-muted`}></i>
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="shadow-sm bg-white position-absolute w-100" 
                                                style={{ 
                                                    zIndex: 1050, 
                                                    maxHeight: "220px", 
                                                    overflowY: "auto", 
                                                    border: "1px solid #dee2e6", 
                                                    borderRadius: "0.375rem",
                                                    marginTop: "4px",
                                                    padding: "8px 12px"
                                                }}
                                            >
                                                {filteredEmployees && filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map((emp) => (
                                                        <div className="form-check my-2" key={emp._id}>
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                value={emp._id} 
                                                                id={`dropdown_emp_${emp._id}`} 
                                                                checked={formdata.assignedusers.includes(emp._id)}
                                                                onChange={handleEmployeeCheckboxChange} 
                                                            />
                                                            <label className="form-check-label w-100" htmlFor={`dropdown_emp_${emp._id}`} style={{ cursor: "pointer" }}>
                                                                {emp.name} <small className="text-muted">({emp.designation || 'Member'})</small>
                                                            </label>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted text-center py-2">
                                                        {selectedProject ? "No employees in this project's team." : "Please select a project first."}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button type="button" className="btn global_btn" data-bs-dismiss="modal" onClick={handlecreateTask}>Create</button>
                                </form>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                }
            </div>
            
            {/* Columns (To Do, In Progress, Etc.) */}
            <div className="projectcard_Wrap">
              {selectedProject ? (
                <>
                {/* To Do Column */}
                <div className="todo pCol" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "To Do")}>
                  <h4>To Do</h4>
                  {filterTasks("To Do")?.map((task) => (
                    <div key={task?._id || task?.id} draggable onDragStart={(e) => handleDragStart(e, task?._id || task?.id)} style={{ cursor: 'move' }}>
                        <ProjectCards id={task?._id || task?.id} task={task} title={task.task_name} onOpenModal={openTaskModal} />
                    </div>
                  ))}
                </div>

                {/* In Progress Column */}
                <div className="inprogress pCol" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "In Progress")}>
                  <h4>In Progress</h4>
                  {filterTasks("In Progress")?.map((task) => (
                    <div key={task?._id || task?.id} draggable onDragStart={(e) => handleDragStart(e, task?._id || task?.id)} style={{ cursor: 'move' }}>
                        <ProjectCards id={task?._id || task?.id} task={task} title={task.task_name} onOpenModal={openTaskModal} />
                    </div>
                  ))}
                </div>

                {/* Review Column */}
                <div className="review pCol" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Review")}>
                  <h4>Review</h4>
                  {filterTasks("Review")?.map((task) => (
                    <div key={task?._id || task?.id} draggable onDragStart={(e) => handleDragStart(e, task?._id || task?.id)} style={{ cursor: 'move' }}>
                        <ProjectCards id={task?._id || task?.id} task={task} title={task.task_name} onOpenModal={openTaskModal} />
                    </div>
                  ))}
                </div>

                {/* Done Column */}
                <div className="done pCol" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Done")}>
                  <h4>Done</h4>
                  {filterTasks("Done")?.map((task) => (
                    <div key={task?._id || task?.id} draggable onDragStart={(e) => handleDragStart(e, task?._id || task?.id)} style={{ cursor: 'move' }}>
                        <ProjectCards id={task?._id || task?.id} task={task} title={task.task_name} onOpenModal={openTaskModal} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-100 text-center py-5 text-muted">
                <h5 className="textMuted">Please select a Project from the dropdown to view tasks.</h5>
              </div>
            )}
          </div>
            <div className="modal fade" id="taskDetailModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        {selectedTask && <TaskDetails task={selectedTask} projects={projects} members={filteredEmployees} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tasks;