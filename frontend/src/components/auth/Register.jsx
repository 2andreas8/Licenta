import React, { useState } from 'react';
import { register } from "../../services/authService";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const[form, setForm] = useState({
        username: '',
        password: '',
        email: '',
        full_name: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigator = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await register(form);
            setSuccess('Registration successful! You can log in now.');
            setForm({username: '', password: '', email: '', full_name: ''});
            navigator('/');
        } catch (error) {
            setError(error.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center relative bgg-gradient-to-b from-purple-800 to-purple-900">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-no-repeat bg-cover bg-center"
                style={{ backgroundImage: "url(/LoginFundal1.jpg)" }}
            ></div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>

            {/* Register card */}
            <div className="relative z-10 bg-white bg-opacity-10 rounded-xl shadow-xl p-8 max-w-lg w-full backdrop-blur-lg border border-white border-opacity-20">
                <h2 className="text-center text-2xl font-bold text-white mb-4">Register</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="mb-2 text-red-400">{error}</div>}
                    {success && <div className="mb-2 text-green-400">{success}</div>}
                    <div className="mb-4 relative">
                        <input
                            className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">👤</i>
                    </div>
                    <div className="mb-4 relative">
                        <input
                            className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            type="password"    
                            id="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">🔒</i>
                    </div>
                    <div className="mb-4 relative">
                        <input
                            className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            type="email"    
                            id="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">@</i>
                    </div>
                    <div className="mb-4 relative">
                        <input
                            className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            type="text"    
                            id="full_name"
                            name="full_name"
                            placeholder="Full Name"
                            value={form.full_name}
                            onChange={handleChange}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">📝</i>
                    </div>
                    <button
                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                        type="submit"
                    >
                        Register
                    </button>
                    <div className="mt-4 text-center">
                        <span className="text-white">Already have an account? </span>
                        <Link to="/" className="text-purple-300 hover:underline hover:text-purple-400">
                            Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}