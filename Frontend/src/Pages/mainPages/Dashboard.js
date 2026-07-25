import React, { useContext, useEffect } from "react";
import { AuthContext } from "../../Context/AuthContext";
import BoxCards from "../../Component/BoxCards";
import "./Dashboard.css";
import Charts from "../../Component/Charts";
import { useOrganization } from "../../Hooks/useOrganization";
import { useProjectdata } from "../../Hooks/useProjectdata";

const Dashboard = () => {
  const {user, onlineUsers, toggleBreakStatus} = useContext(AuthContext);
  const { teams, employees, fetchTeams, fetchUser, getattandance, attandanceData, weeklyWorkingHours, weeklyData} = useOrganization();
  const { projects, fetchProjects, fetchTasks, tasks } = useProjectdata();
  
  const currentUserId = user?.id || user?._id;
  const currentUserRole = user?.role;
  const isCurrentlyOnBreak = onlineUsers?.[String(currentUserId)]?.status === 'Break';
  const myTeam = teams?.find(team =>  
    team.employee_ids?.some(emp => (emp._id || emp.id || emp) === currentUserId) ||  
    team.manager_id === currentUserId
  );
  const currentTeamId = ( myTeam?._id || myTeam?.id)
  // console.log(currentTeamId)
  const projectsByTeam = projects?.filter(project =>
    project.team_ids?.some(teamId => teamId?._id || teamId?.id === myTeam?._id?.toString())
  ) || [];
  const assignedTask = tasks?.filter(task => task.assigned_users?.some(user => (user._id || user.id || user) === currentUserId)) || [];
  const teamMembers = employees?.filter(emp => 
    myTeam?.employee_ids?.some(teamEmpId => (teamEmpId._id || teamEmpId.id || teamEmpId) === emp._id)
  ) || [];
  const teamManager = employees?.find(emp => emp._id === myTeam?.manager_id);
  const managerId = teamManager ? String(teamManager._id || teamManager.id) : null;
  const managerSocketData = onlineUsers && managerId ? onlineUsers[managerId] : null;

  let managerStatusText = teamManager?.working_status || 'Offline';
  let managerBadgeClass = 'red_badge';

  if (managerSocketData) {
    managerStatusText = managerSocketData.status;
  }
  managerBadgeClass = managerStatusText === 'Break' ? 'yellow_badge' : managerStatusText === 'Working' ? 'green_badge' : 'red_badge';
 
  const checkInStr = new Date(attandanceData?.check_in_time);
  const localTime = checkInStr.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const jobs = () => {
    if(currentUserRole === "Manager"){
      return projectsByTeam.length;
    }
    return String(assignedTask.length);
  }

    
  const weeklyhourslogged = (weeklyData?.reduce((sum, day) => sum + (parseFloat(day.hours_logged) || 0), 0) || 0);
  const presentDaysThisWeek = weeklyData?.filter(item => (parseFloat(item.hours_logged) || 0) > 0 || item.status === 'Working' || item.status === 'Break').length;
  const weeklyAttandance = ((presentDaysThisWeek / 5) * 100 || 0);
  
  useEffect(() => {
    fetchUser();
  }, [managerSocketData])
 
  const cardsData = [
    {
      id: 1,
      title: "Total Tasks",
      value: jobs() || '0',
      icon: "fa-tasks",
      color: "#a78bfa",
      subText: `${assignedTask.filter(t => t.status === 'In Progress').length} In Progress`,
    },
    {
      id: 2,
      title: "Task Completed",
      value: (assignedTask.filter(task => task.status === "Done").length || 0),
      icon: "fa-check",
      color: "#34D399", 
      subText: "Tasks successfully finished",
    },
    {
      id: 3,
      title: "Hours Logged",
      value: String(weeklyhourslogged.toFixed(2)),
      icon: "fa-clock",
      color: "#fbbf24",
      subText: "Total logged hours (Weekly)",
    },
    {
      id: 4,
      title: "Weekly Attendance in %",
      value: weeklyAttandance,
      icon: "fa-user-check",
      color: weeklyAttandance >= 70 ? "#34D399" : "#F87171", 
      subText: `Check in time Today is ${localTime}`
    },
  ];
  useEffect(() => {
    fetchTeams();
    fetchUser();
    fetchProjects();
    fetchTasks();
    if (currentUserId) {
      getattandance(currentUserId);
      weeklyWorkingHours(currentUserId);
    }
  }, [currentUserId]);


  
  return (
    <>
      <div className="dashboard_container">
        <div className="dashboard_header d-flex justify-content-between align-items-center">
          <h1 className="mb-0">Welcome, <span className="lightBlue">{user?.name || 'Guest'}</span> !</h1>
          <button className="btn global_btn" onClick={() => toggleBreakStatus(!isCurrentlyOnBreak)}>
            {isCurrentlyOnBreak ? 'Resume Work' : 'Take a Break'}
          </button>
        </div>
        <div className="cards_container">
          {cardsData.map((card) => (
            <BoxCards key={card.id} title={card.title} value={card.value} subText={card.subText} color={card.color} icon={card.icon} />
          ))}
        </div>
        <Charts teamId={currentTeamId} userId={currentUserId} />
        <div className="works_container">
          <div className="boxCard">
            <h4>Assigned Tasks</h4>
            {projectsByTeam && projectsByTeam.length > 0 ? (
              projectsByTeam.map((project) => {
                const projectTasksForUser = assignedTask.filter(
                  (task) => String(task.project_id) === String(project._id || project.id)
                );

                if (projectTasksForUser.length === 0 && currentUserRole !== 'Manager') return null;

                return (
                  <div className="project_item" key={project._id || project.id}>
                    <h5 className="mt-2 text-white text-secondary">
                      {project.project_name || project.project_title}
                      {project.is_overdue && (
                          <span className="sm_badge red_badge mx-2 mt-2 d_inlineBlock">
                              <i className="fas fa-exclamation-triangle me-1"></i> Overdue
                          </span>
                      )}
                      {project.is_over_hours && (
                          <span className="sm_badge solid_blue_badge mt-2 d_inlineBlock">
                              <i className="fas fa-clock me-1"></i> Hours Exceeded
                          </span>
                      )}
                    </h5>
                    
                    {projectTasksForUser.map((task) => (
                      <div className="task_wrap" key={task._id || task.id}>
                        <h6 className="lightBlue mb-0">{task.task_name || task.task_title}</h6>
                        <div className="mb-0">
                          <span className={`sm_badge me-2 ${task.priority === 'High' ? 'red_badge' : task.priority === 'Medium' ? 'yellow_badge' : 'green_badge'}`}>
                            {task.priority}
                          </span>
                          <span className="violet_badge sm_badge">
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <h6 className="textMuted">No projects found for your team.</h6>
            )}

            {projectsByTeam && assignedTask.length === 0 && (
              <h6 className="textMuted py-3">No tasks assigned to you yet!</h6>
            )}
          </div>
          <div className="boxCard">
            <h4>Team Status</h4>
            {myTeam ? (
              <>
                <div>
                  <h5>Manager Name: <span className="lightBlue">{teamManager?.name || 'Not assigned'}</span></h5>
                  {teamManager && <p>Manager Status: <span className={`sm_badge ${managerBadgeClass}`}>{managerStatusText}</span></p>}
                </div>
                <p>Team Name: <span className="sm_badge violet_badge">{myTeam?.team_name}</span></p>
                {teamMembers.length > 0 ? (teamMembers.map((member) => {
                  const memberId = String(member._id || member.id);
                  const userSocketData = onlineUsers ? onlineUsers[memberId] : null;
                  
                  let statusText = member.working_status || 'Offline';
                  if (userSocketData) {
                    statusText = userSocketData.status; 
                  }

                  const badgeClass = statusText === 'Break' ? 'yellow_badge' : statusText === 'Working' ? 'green_badge' : 'red_badge';
                  return(
                    <div className="task_wrap" key={member._id}>
                      <h6 className="lightBlue mb-0">{member.name}</h6>
                      {onlineUsers && 
                        <p className="mb-0"><span className={ `sm_badge ${badgeClass}`}>{statusText}</span></p>
                      }
                      
                    </div>
                  );
                })
                ) : (<h6 className="mb-0">No Members in this team</h6>
                )}
              </>
            ) : (
              <h5>No Team Assigned</h5>
            )}
          </div>
        </div>
      </div> 
    </>
  )
};
export default Dashboard;