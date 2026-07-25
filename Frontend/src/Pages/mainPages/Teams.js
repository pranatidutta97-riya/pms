import React, { useContext, useEffect, useState } from "react";
import { useOrganization } from "../../Hooks/useOrganization";
import "./Teams.css";
import { useProjectdata } from "../../Hooks/useProjectdata";
import { AuthContext } from "../../Context/AuthContext";

const Teams = () => {
  const [formdata, setformdata] = useState(null)
  const [selectedEmployee, setselectedEmployee] = useState(null)
  const [selectedTeam, setselectedTeam] = useState(null)
  const [empAssignedtask, setempAssignedtask] = useState([])
  const { teams, employees, fetchTeams, fetchUser, assignUser, createTeam, updateTeam, deleteUser, weeklyData, getattandance, attandanceData, weeklyWorkingHours} = useOrganization();
  const { projects, fetchProjects, fetchTasks, tasks } = useProjectdata();
  const {getInitials} = useContext(AuthContext);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setformdata({
      ...formdata,
      [name]: value
    })
  }
  const handlecreateTeam = async () => {
    const result = await createTeam(formdata?.teamName);
    if (result && result.success) {
      alert("Team Created Successfully");
      setformdata({ teamName: "" });
    } else {
      alert(`Error: ${result?.error}`);
    }
    console.log(formdata)
  }
  const handleEditClick = (employee) => {
    setselectedEmployee(employee);
    const empManagerId = employee.manager_id?._id || employee.manager_id || "";
    const empTeamId = employee.team_id?._id || employee.team_id || "";
    setformdata({
      ...formdata,
      role: employee.role || "",
      manager: empManagerId.toString(),
      team: empTeamId.toString()
    });
  }
  const handleViewClick = (employee) => {
    setselectedEmployee(employee);
    const c_userId = (employee?._id || employee?.id)?.toString();
    const assignedTask = tasks?.filter(task => task.assigned_users?.some(user => (user._id || user.id || user)?.toString() === c_userId)) || [];
    if (employee?._id || employee?.id) {
      const empId = employee._id || employee.id;
      getattandance(empId);
      weeklyWorkingHours(empId);
    }
    setempAssignedtask(assignedTask);
    console.log("Assigned Task:", empAssignedtask);
  }
  const handleEditTeam = (team) => {
    setselectedTeam(team);
    setformdata({
      ...formdata,
      newteamName: team.team_name || ""
    })
  }
  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    const result = await assignUser({
      userId: selectedEmployee._id,
      role: formdata?.role,
      teamId: formdata?.team,
      managerId: formdata?.manager
    });
    fetchTeams();
    fetchUser();
    setselectedEmployee(null);
    setformdata(null);
    console.log("Update Result:", result)
  }
  const handleTeamUpdate = async () => {
    if(!selectedTeam) return;
    const teamId = selectedTeam?._id || selectedTeam?.id;
    const result = await updateTeam(teamId,formdata?.newteamName);
    if(result && result.success){
      fetchTeams();
      setformdata(null);
      setselectedTeam(null);
      console.log("Update Result:", result)
    }
  }
  const handleDelete = async (employee) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (confirmDelete) {
      try {
        const result = await deleteUser(employee._id);
        console.log("Delete Result:", result);
        if (result && (result.message)) {
          alert("Employee deleted successfully");
          fetchTeams();
          fetchUser();
        } else {
          alert("Failed to delete employee");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("An error occurred while deleting the employee.");
      }
    }
  }
  const presentDaysThisWeek = weeklyData?.filter(item => (parseFloat(item.hours_logged) || 0) > 0 || item.status === 'Working' || item.status === 'Break').length;
  const weeklyAttandance = ((presentDaysThisWeek / 5) * 100 || 0);
  const today_date = new Date().toISOString().split('T')[0]
  const todayAttendance = (attandanceData?.date === today_date) && (attandanceData?.user_id === (selectedEmployee?._id || selectedEmployee?.id)?.toString()) || false;
  const working_status = todayAttendance ? attandanceData?.status : "offline";
  
  useEffect(() => {
    fetchTeams();
    fetchUser();
    fetchProjects();
    fetchTasks();
  }, [])


  return (
    <div>
        <h1>Our <span className="lightBlue">Teams</span></h1>
        <div className="createTeamWrap mt-5">
          <button type="button" className="btn global_btn" data-bs-toggle="modal" data-bs-target="#createTeamModal">
            <i className="fas fa-plus"></i> Create New Team
          </button>

          <div className="modal fade" id="createTeamModal" tabindex="-1" aria-labelledby="createTeamModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title fs-5" id="createTeamModalLabel">Create Team</h4>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label htmlFor="teamName" className="col-form-label">Team Name:</label>
                      <input type="text" name="teamName" value={formdata?.teamName || ""} className="form-control" id="teamName" onChange={handleInputChange} />
                    </div>
                    <button type="button" className="btn global_btn" data-bs-dismiss="modal" onClick={handlecreateTeam}>Create</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="data_table teams boxCard mt-5">
          <h4 className="mt-3 mb-4">Team Details</h4>
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Members</th>
                <th>Manager</th>
                <th>Projects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const teamProjectCount = projects?.filter(project => 
                  project.team_ids?.some(t => (t?.id || t?._id || t)?.toString() === team._id?.toString())
                ).length || 0;
                return (
                  <tr key={team.id}>
                    <td><strong>{team.team_name}</strong></td>
                    <td>{team.employee_ids.length}</td>
                    <td><span className="sm_badge blue_badge">{(team.manager_name) || 'No Manager'}</span></td>
                    <td>{teamProjectCount}</td>
                    <td>
                      <button className="btn global_btn me-2" data-bs-toggle="modal" data-bs-target="#editTeamModal" onClick={() => handleEditTeam(team)}><i className="fas fa-edit"></i></button>
                      <button className="btn transparent_btn"><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="modal fade" id="editTeamModal" tabindex="-1" aria-labelledby="editTeamModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title fs-5" id="editTeamModalLabel">{selectedTeam?.team_name}</h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="newteamName" className="col-form-label">New Team Name:</label>
                    <input type="text" name="newteamName" value={formdata?.newteamName || ""} className="form-control" id="newteamName" onChange={handleInputChange} />
                  </div>
                  <button type="button" className="btn global_btn" data-bs-dismiss="modal" onClick={handleTeamUpdate}>Save</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="data_table users boxCard mt-5">
          <h4 className="mt-3 mb-4">Our Employees</h4>
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees && employees.filter((employee) => employee.role !== "Admin").map((employee) => {
                return (
                  <tr key={employee._id}>
                    <td><strong>{employee.name}</strong></td>
                    <td>{employee.email}</td>
                    <td>{employee.role}</td>
                    <td>{employee.team_name}</td>
                    <td>
                      <button className="btn global_btn me-2" data-bs-toggle="modal" data-bs-target="#viewUserModal" onClick={() => handleViewClick(employee)}><i className="fas fa-eye"></i></button>
                      <button className="btn global_btn me-2"  data-bs-toggle="modal" data-bs-target="#editUserModal" onClick={() => handleEditClick(employee)}><i className="fas fa-edit"></i></button>
                      <button className="btn transparent_btn" onClick={() => handleDelete(employee)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="modal fade" id="viewUserModal" tabindex="-1" aria-labelledby="viewUserModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title d-flex align-items-center" id="viewUserModalLabel"><span className="avatar-circle me-3">{getInitials(selectedEmployee?.name || 'User')}</span><h4 className="mb-0">{selectedEmployee?.name}<small>{selectedEmployee?.role}</small></h4></div>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="user_detail textMuted">
                  <div className="details_wrap">
                      <div className="detail_item">
                        <h5><i className="fas fa-envelope me-3"></i>Email-ID:</h5>
                        <p className="mb-0">{selectedEmployee?.email}</p>
                      </div>
                      <div className="detail_item">
                        <h5><i className="fas fa-user-tie me-3"></i>Manager Name:</h5>
                        <p className="mb-0">{selectedEmployee?.manager_name || 'No Manager'}</p>
                      </div>
                      <div className="detail_item">
                        <h5><i className="fas fa-people-group me-3"></i>Team Name:</h5>
                        <p className="mb-0">{selectedEmployee?.team_name || 'Not Assigned'}</p>
                      </div>
                      <div className="detail_item">
                        <h5><i className="far fa-clock me-3"></i>Attandance:</h5>
                        <p className="mb-0">{weeklyAttandance}% <span className={`sm_badge ms-3 ${working_status === 'Working' ? 'green_badge' : working_status === 'Break' ? 'yellow_badge' : 'red_badge'}`}>{working_status}</span></p>
                      </div>
                  </div>
                  <hr/>
                  <div className="assaigned_task">
                      <h5 className="mb-3">Assigned Task - <span className="sm_badge violet_badge">{empAssignedtask.length}</span> :</h5>
                      {empAssignedtask && empAssignedtask.length > 0 ? (
                        <ul className="list-group">
                          {empAssignedtask.map((task) => {
                            const taskProject = projects.find(p => p._id === task.project_id);
                            return(
                            <li className="list-group-item d-flex justify-content-between align-items-center mb-2" key={task._id}>
                              <div className="task_info">
                                <h6>Task Name: {task.task_name}</h6>
                                <p className="mb-0"><strong>Project Name:</strong> {taskProject ? taskProject.project_title : 'Project not found'}</p>
                              </div>
                              <span className="sm_badge blue_badge">{task.status}</span>
                            </li>
                          )}
                          )}
                        </ul>
                      ) : (
                        <p>No tasks assigned</p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title fs-5" id="editUserModalLabel">{selectedEmployee?.name}</h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="role" className="col-form-label">Role:</label>
                    <input type="text" name="role" value={formdata?.role || ""} className="form-control" id="role" onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="team" className="col-form-label">Team:</label>
                    <select name="team" id="team" className="form-control form-select" onChange={handleInputChange}>
                      <option value="">Select Team</option>
                    {teams.map((team) => {
                    
                      return <option key={team._id} value={team._id}>{team.team_name}</option>
                    })}
                    </select>
                  </div>
                  <button type="button" className="btn global_btn" data-bs-dismiss="modal" onClick={handleUpdate}>Save</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        
    </div>
  );
};
export default Teams;