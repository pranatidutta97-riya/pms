import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [message, setMessage] = useState('');
  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData(prevState => ({
        ...prevState,
        [id]: value
    }));
  }
  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('http://mayurpankhi:9005/api/auth/register', {
            method: 'POST',
            mode: 'cors',
            headers: {
            'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            setMessage(errorData.error || "Registration failed!");
            return;
        }
        const data = await response.json();
        setMessage('Registration successful!');
        navigate("/login");
        console.log(data);
    } catch (error) {
        setMessage('An error occurred during registration.');
        console.error(error);
    }
  }

  return (
    <>
      <div className="auth_page">
        <div className="container pt-5">
            <div className="row">
                <div className="col-md-6">
                    <div className="boxCard">
                        <h1>Register</h1>
                        <form onSubmit={handleRegister}>
                          <div className="form-group">
                                <label htmlFor="name">Name:</label>
                                <input type="text" id="name" className="form-control" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" className="form-control" onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input type="password" id="password" className="form-control" onChange={handleChange} />
                            </div>
                            <button className="btn global_btn mt-4">Register</button>
                            <p style={{ color: 'red' }}>{message}</p>
                        </form>
                        
                    </div>
                </div>
            </div>
        </div>
      </div> 
    </>
  )
};
export default Register;