import React, { useEffect, useState } from "react";
import { useProjectdata } from "../Hooks/useProjectdata";

const ProjectDetail = ({ project, userRole, userTeam }) => {
    const {projects, updateProject, fetchProjects} = useProjectdata();
    const [projectData, setprojectData] = useState({
        projectTitle: project?.project_title || '',
        projectDesc: project?.description || '',
        priority: project?.priority || '',
        deadline: project?.deadline || '',
        status: project?.status || '',
        estimated_hours: project?.estimated_hours || 0.0,
        // teams: project?.team_ids || []
    })
    const pID = project?._id || project?.id;
    const [isEditable, setisEditable] = useState(false);
    const hanleEditaccess = () => {
        setisEditable(!isEditable);
    }
    const handleChange = (e) => {
        const {name, value} = e.target;
        setprojectData(prevState => ({
            ...prevState,
            [name]: value
        }))
    }
    const EditProjectData = async() => {
        try{
            await updateProject(pID, projectData);
            project.project_title = projectData.projectTitle;
            project.description = projectData.projectDesc;
            project.priority = projectData.priority;
            project.status = projectData.status;
            project.deadline = projectData.deadline;
            project.estimated_hours = Number(projectData.estimated_hours);
            setisEditable(false);
            setprojectData(
                {
                    projectTitle: project?.project_title || '',
                    projectDesc: project?.description || '',
                    priority: project?.priority || '',
                    deadline: project?.deadline || '',
                    status: project?.status || '',
                    estimated_hours: project?.estimated_hours || 0.0,
                    // teams: project?.team_ids || []
                }
            )
            // await fetchProjects();
        }
        catch(error){
            console.error("Error updating project", error);
        }
    }
    const editallowed = (userRole === "Admin" || (userRole === "Manager" && project?.team_ids?.some(team => team.id === userTeam)));
    useEffect(() => {
        fetchProjects();
    }, [])
    return (
        <div className="project-detail">
            <div className="modal-header">
                <h4 className="modal-title fs-5" id="projectDetailModalLabel">Details of {project?.project_title}</h4>
                <button type="button" className="btn transparent_btn ms-4" onClick={hanleEditaccess}><i className="fas fa-edit me-2"></i>Edit</button>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body textMuted">
                {isEditable ? 
                    (
                       <div className="edit_mode">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="projectTitle" className="form-label fw-bold">Project Title</label>
                                    <input type="text" className="form-control" name="projectTitle" value={projectData.projectTitle} onChange={handleChange}/>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label fw-bold">Project Title</label>
                                    <textarea className="form-control" name="projectDesc" value={projectData.projectDesc} onChange={handleChange}></textarea>
                                </div>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="priority" className="form-label fw-bold">Project Priority</label>
                                        <select className="form-control" name="priority" value={projectData.priority} onChange={handleChange}>
                                            <option value="">Select Priority</option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="status" className="form-label fw-bold">Project Status</label>
                                        <input type="text" className="form-control" name="status" value={projectData.status} onChange={handleChange}/>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label htmlFor="deadline" className="form-label fw-bold">Project Deadline</label>
                                        <input type="date" className="form-control" name="deadline" value={projectData.deadline} onChange={handleChange}/>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="estimated_hours" className="form-label fw-bold">Estimated Hours</label>
                                    <input type="number" className="form-control" name="estimated_hours" value={projectData.estimated_hours} onChange={handleChange}/>
                                </div>
                                <button type="button" className="btn global_btn" onClick={EditProjectData}>Update</button>
                            </form>
                        </div> 
                    )
                    : (
                        <div className="view_mode">
                            <p>{project.description}</p>
                            <p>Priority: {project.priority}</p>
                            <p>Status: {project.status}</p>
                            <p>Deadline: {project.deadline}</p>
                            <p>Billable: {project.isbillable ? 'Yes' : 'No'}</p>
                            <p>Estimated Hours: {project.estimated_hours}</p>
                            <p>Logged Hours: {project.logged_hours || 0}</p>
                            {project.is_overdue && (
                                <span className="sm_badge red_badge me-2 mt-2 d_inlineBlock">
                                    <i className="fas fa-exclamation-triangle me-1"></i> Overdue
                                </span>
                            )}
                            {project.is_over_hours && (
                                <span className="sm_badge solid_blue_badge mt-2 d_inlineBlock">
                                    <i className="fas fa-clock me-1"></i> Hours Exceeded
                                </span>
                            )}
                        </div>
                    )
                }
            </div>
        
        </div>
    );
};

export default ProjectDetail;