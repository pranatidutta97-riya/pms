import { Routes, Route } from 'react-router-dom';
import Dashboard from '../Pages/mainPages/Dashboard';
import ProtectedRoutes from './protectedRoutes';
import Notfound from '../Pages/Notfound';
import Login from '../Pages/auth/Login';
import Register from '../Pages/auth/Register';
import MainLayout from '../Layout/MainLayout';
import Teams from '../Pages/mainPages/Teams';
import Projects from '../Pages/mainPages/Projects';
import Messages from '../Pages/mainPages/Messages';
import Tasks from '../Pages/mainPages/Tasks';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/' element={<Login/>} />
            <Route element={<ProtectedRoutes><MainLayout /></ProtectedRoutes>}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/projects' element={<Projects />} />
                <Route path='/tasks' element={<Tasks />} />
                <Route path='/teams' element={<Teams />} />
                <Route path='/messages' element={<Messages />} />
            </Route>
            <Route path='*' element={<Notfound/>} />
        </Routes>
    );
};
export default AppRoutes;