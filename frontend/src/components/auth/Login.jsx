import React, { useState } from 'react';
import { login } from "../../services/authService";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const navigator = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(username, password);
            toast.success('Welcome back, ' + username + '!');
            navigator('/dashboard');
        } catch (error) {
            alert(error.detail || 'Login failed');
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

            {/* Login card */}
            <div className="relative z-10 bg-white bg-opacity-10 rounded-xl shadow-xl p-8 max-w-lg w-full backdrop-blur-lg border border-white border-opacity-20">
                <h2 className="text-center text-2xl font-bold text-white mb-4">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 relative">
                        <input
                            className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
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
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">🔒</i>
                    </div>
                    <button
                        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                        type="submit"
                    >
                        Login
                    </button>
                    <div className="mt-4 text-center">
                        <span className="text-white">Don't have an account? </span>
                        <Link to="/register" className="text-purple-300 hover:underline hover:text-purple-400">
                            Register
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}