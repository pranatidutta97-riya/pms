import React, { useContext, useEffect } from "react";
import "./Projects.css";
import ProjectCards from "../../Component/ProjectCards";
import { useState } from 'react';
import { useOrganization } from "../../Hooks/useOrganization";
import { useProjectdata } from "../../Hooks/useProjectdata";
import ProjectGrid from "../../Component/ProjectGrid";
import { AuthContext } from "../../Context/AuthContext";
import ProjectDetail from "../../Component/ProjectDetail";

const Projects = () => {
  const {fetchTeams, teams} = useOrganization();
  const { user } = useContext(AuthContext);
  const { projects, fetchProjects, createProject } = useProjectdata();
  const [formdata, setFormdata] = useState({
    projectTitle: "",
    projectDesc: "",
    priority: "",
    deadline: "",
    status: "To Do",
    isbillable: true,
    teams: [],
    estimated_hours: 0.0
  });
  const [selectedProject, setselectedProject] = useState(null)
  const currentUserID = user?._id || user?.id;
  const currentUserType = user?.role;
  const currentUserTeamID = user?.team_id;
  const [searchTerm, setSearchTerm] = useState("");
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevstate) => {
      return {
        ...prevstate,
        [name]: value
      }
    })
  }
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormdata((prevstate) => {
      if (checked) {
        return { ...prevstate, teams: [...prevstate.teams, value] };
      } else {
        return { ...prevstate, teams: prevstate.teams.filter(id => id !== value) };
      }
    });
  };
  const handlecreateProject = async (e) => {
    e.preventDefault();
    const projectData = {
      projectTitle: formdata.projectTitle,
      projectDesc: formdata.projectDesc,
      priority: formdata.priority,
      deadline: formdata.deadline,
      status: formdata.status,
      isbillable: formdata.isbillable,
      teams: formdata.teams,
      estimated_hours: Number(formdata.estimatedHours)
    }
    try{
      await createProject(projectData);
      setFormdata({
        projectTitle: "",
        projecDesc: "",
        priority: "",
        deadline: "",
        status: "To Do",
        isbillable: true,
        teams: [],
        estimatedHours: 0.0
      })
      fetchProjects();
    }
    catch(error){
      console.error("Project creation error", error)
    } 
  }
  useEffect(() => {
    fetchProjects();
    fetchTeams();
  },[])

  const filteredProject = (projects || []).filter((project) => {
    const searchLower = searchTerm.toLowerCase();
    const matchTitle = (project.project_title || project.title).toLowerCase().includes(searchLower);
    const matchDesc = (project.description || project.desc).toLowerCase().includes(searchLower);
    return matchTitle || matchDesc;
  })
  const displayProjects = filteredProject.filter((project) => {
    if (currentUserType === "Admin") {
      return true; // Show all projects for Admin
    } 
    const projectTeams = project.team_ids || [];
    return currentUserTeamID ? projectTeams.some(team => team.id === currentUserTeamID) : true;
  })
  const openProjectModal = (project) => {
    setselectedProject(project);
    const modal = new window.bootstrap.Modal(document.getElementById('projectDetailModal'));
    modal.show();
    console.log("Opening modal for project:", project);
  };
  

  return (
        <div className="projects">
            <h1>Strategic <span className="lightBlue">Initiatives & Projects</span></h1>
            <div className="createTaskWrap d-flex align-items-center justify-content-between mt-5">
              {(currentUserType === "Admin") &&
                <>
                <button className="btn global_btn" data-bs-toggle="modal" data-bs-target="#createProjectModal"><i className="fas fa-plus"></i> Create New Project</button>
                <div className="modal fade" id="createProjectModal" tabindex="-1" aria-labelledby="createProjectModalLabel" aria-hidden="true">
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h4 className="modal-title fs-5" id="createProjectModalLabel">Create Project</h4>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                        <form>
                          <div className="mb-3">
                            <label htmlFor="projectTitle" className="col-form-label">Project Title:</label>
                            <input type="text" name="projectTitle" value={formdata?.projectTitle || ""} className="form-control" id="projectTitle" onChange={handleInputChange} />
                          </div>
                          <div className="mb-3">
                            <label htmlFor="projectDesc" className="col-form-label">Project Description:</label>
                            <textarea name="projectDesc" value={formdata?.projectDesc || ""} className="form-control" id="projectDesc" onChange={handleInputChange} />
                          </div>
                          <div className="mb-3">
                            <label htmlFor="priority" className="col-form-label">Project Priority:</label>
                            <select name="priority" value={formdata?.priority || ""} className="form-control" id="priority" onChange={handleInputChange} >
                              <option value="">Select Priority</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="mb-3 me-2">
                              <label htmlFor="deadline" className="col-form-label">Project Deadline:</label>
                              <input type="date" name="deadline" value={formdata?.deadline || ""} className="form-control" id="deadline" onChange={handleInputChange} />
                            </div>
                            <div className="mb-3">
                              <label htmlFor="estimatedHours" className="col-form-label">Estimated Hours:</label>
                              <input type="number" name="estimatedHours" value={formdata?.estimatedHours || 0.0} className="form-control" id="estimatedHours" onChange={handleInputChange} />
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="mb-3 me-3">
                              <label htmlFor="status" className="col-form-label">Project Status:</label>
                              <input type="text" name="status" value={formdata?.status || ""} className="form-control" id="status" onChange={handleInputChange} />
                            </div>
                            <div className="mb-3">
                              <input 
                                type="checkbox" 
                                name="isbillable" 
                                className="form-check-input me-2" 
                                id="isbillable" 
                                checked={formdata.isbillable || false} 
                                onChange={(e) => {
                                  const { name, checked } = e.target;
                                  setFormdata((prevstate) => ({
                                    ...prevstate,
                                    [name]: checked
                                  }));
                                }}
                              />
                              <label className="form-check-label" htmlFor="isbillable">
                                Is this project billable?
                              </label>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label htmlFor="teams" className="col-form-label">Project Assaigned:</label>
                            {teams && teams.map((team) => {
                                return <div className="form-check" key={team._id}>
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    value={team._id} 
                                    id={team._id} 
                                    checked={formdata.teams.includes(team._id)}
                                    onChange={handleCheckboxChange} 
                                  />
                                  <label className="form-check-label" htmlFor={team._id}>
                                    {team.team_name}
                                  </label>
                                </div>
                              })}
                          </div>
                          <button type="button" className="btn global_btn" data-bs-dismiss="modal" onClick={handlecreateProject}>Create</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              }
              
              <div className="searchBar">
                <div className="input-group mb-3">
                  <input type="text" className="form-control" placeholder="Search Projects..." aria-label="Recipient's username" value={searchTerm} onChange={handleSearch} aria-describedby="basic-addon2" />
                  <button className="input-group-text btn global_btn" id="basic-addon2"><i className="fas fa-search"></i></button>
                </div>
              </div>
            </div>
            <div className="projects_Wrap">
              {displayProjects && displayProjects.map((project) => {
                return <ProjectGrid key={project._id || project.id} project={project} teams={project.team_ids || []} onOpenModal={openProjectModal} />
              })}
            </div>
            <div className="modal fade" id="projectDetailModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        {selectedProject && <ProjectDetail key={selectedProject._id || selectedProject.id} project={selectedProject} userRole={currentUserType} userTeam={currentUserTeamID} />}
                    </div>
                </div>
            </div>
        </div>
  );
};
export default Projects;