import { Link } from "react-router-dom";

const Notfound = () => {
  return (
    <div className="container">
      <h1>404</h1>
      <Link to="/dashboard">Go Home</Link>
    </div>
  );
};
export default Notfound;