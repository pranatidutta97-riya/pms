import React, { useContext, useEffect } from "react";
import "./Auth.css";
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const [formdata, setformdata] = useState({});
    const [message, setmessage] = useState('');
    const {user,login} = useContext(AuthContext);
    useEffect(() => {
        if (user) {
          navigate('/dashboard');
        }
    }, [user, navigate]);
    const handleChange = (e) => {
        e.preventDefault();
        const {id, value} = e.target;
        setformdata(prevState => ({...prevState, [id]: value }));
    }
    const handleLogin = async(e) => {
        if (e) e.preventDefault();
        try{
            const res = await fetch('http://mayurpankhi:9005/api/auth/login', {
                method: 'POST',
                mode: 'cors',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify(formdata)
            })
            
            if (!res.ok) {
                // const errorData = await res.json();
                alert("Backend auth failed!");
                return;
            }
            const ldata = await res.json();
            localStorage.setItem('token', ldata.token);
            login(ldata.user)
            
            setmessage(ldata.message);
            alert("Login Successful!");
            navigate('/dashboard');
            console.log(ldata);
        }catch(error){
            console.error(error);
            alert("Network Error")
        }
        
    }
    const handleGoogleSuccess = async (credentialResponse) => {
        const response = await fetch('http://mayurpankhi:9005/api/auth/google-login', {
            method: 'POST',
            mode: 'cors',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: credentialResponse.credential
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.error || "Backend auth failed!");
            return;
        }
        const data = await response.json();

        localStorage.setItem('token', data.token);
        login(data.user);
        alert("Google Login Successful!");
        navigate('/dashboard');
        console.log(data.user);
    
    
};
  return (
    <>
      <div className="auth_page">
        <div className="container pt-5">
            <div className="row">
                <div className="col-md-6">
                    <div className="boxCard">
                        <h1>Login</h1>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" className="form-control" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input type="password" id="password" className="form-control" onChange={handleChange} />
                            </div>
                            <button className="btn global_btn mt-4">Login</button>
                            <Link to="/register">Don't have an account? Register here</Link>
                            <p style={{ color: 'red' }}>{message}</p>
                        </form>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => alert('Google Login Failed!')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
       
    </>
  )
};
export default Login;