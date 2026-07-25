import "./ProjectCards.css"
import TaskDetails from "./TaskDetails";

const ProjectCards = ({task, title, onOpenModal }) => {
    
    console.log(task);
    return (
        <div className="project_card mb-3">
            <h5 className="lightBlue">{title}</h5>
            <p className="desc">{task?.description}</p>
            <div className="my-2 d-flex align-items-center">
                <span className={`sm_badge me-3${task?.priority === 'High' ? ' red_badge' : task?.priority === 'Medium' ? ' yellow_badge' : ' green_badge'}`}>{task?.priority}</span>
                {task?.deadline && <span className="me-3 sm_badge blue_badge">{task?.deadline}</span>}
                <span className="violet_badge sm_badge">{task?.status}</span>
            </div>
            {/* <div className="my-2 d-flex align-items-center">
                <span className="e_hours me-3">{hours} Hours</span>
            </div> */}
            <hr />
            <div className="members d-flex align-items-center">
                {task?.assigned_users?.map((user) => (
                    <p className="member mb-0 me-2 pe-2" key={user._id || user.id}>{user.name}</p>
                ))}
                {(!task?.assigned_users || task?.assigned_users.length === 0) && <small className="textMuted">No member assigned</small>}
            </div>
            <button type="button" className="btn btn-sm global_btn mt-2"  onClick={() => onOpenModal(task)}>View Deatils</button>
        </div>
    )
};
export default ProjectCards;