import "./ProjectGrid.css"
import { useNavigate } from 'react-router-dom'

const ProjectGrid = ({ project, teams, onOpenModal }) => {
    const navigate = useNavigate();
    const pId = project._id || project.id;
    const handleTaskBoard = () => {
        console.log("View Tasks clicked",pId);
        navigate('/tasks' , { state: { selectedProjectId: pId } })
    }
    return (
        <div className="project_grid mb-3">
            <h5 className="lightBlue">{project?.project_title}</h5>
            <p className="desc">{project?.description}</p>
            <div className="my-2 d-flex align-items-center">
                <span className={`sm_badge me-3${project?.priority === 'High' ? ' red_badge' : project?.priority === 'Medium' ? ' yellow_badge' : ' green_badge'}`}>{project?.priority}</span>
                {project?.deadline && <span className="me-3 sm_badge blue_badge">{project?.deadline}</span>}
                <span className="violet_badge sm_badge">{project?.estimated_hours || '0'} Hours</span>
            </div>
            <hr />
            <div className="members d-flex align-items-center">
                {teams?.map((team) => (
                    <p className="member mb-0 me-2 pe-2" key={team._id || team.id}>{team.team_name}</p>
                ))}
                {(!teams || teams.length === 0) && <small className="textMuted">No team assigned</small>}
            </div>
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
                
            <div className="view_tasks mt-5">
                <button type="button" className="btn global_btn viewtask_btn" onClick={handleTaskBoard}>View All Tasks</button>
                <button type="button" className="btn transparent_btn viewtask_btn ms-5" onClick={() => onOpenModal(project)}>View Details</button>
            </div>
        </div>
    )
};
export default ProjectGrid;