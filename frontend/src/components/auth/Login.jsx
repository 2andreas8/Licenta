import React, { useState, useEffect } from 'react';
import { login, getCurrentUser } from "../../services/authService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionExpired, setSessionExpired] = useState('');

    const navigator = useNavigate();

    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        console.log("URL search params:", location.search);
        console.log("session_expired param value:", params.get("session_expired"));
        if (params.has("session_expired")) {
            console.log("Session expired detected in URL");
            setSessionExpired("Session expired. Please log in again.")
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await login(username, password);
            const userDetails = await getCurrentUser();
            sessionStorage.setItem('full_name', userDetails.full_name);
            toast.success('Welcome back, ' + username + '!');
            navigator('/dashboard');
        } catch (error) {
            // alert(error.detail || 'Login failed');
            setError(error?.response?.data?.detail || 'Login failed');
            // toast.error(error?.response?.data?.detail || 'Login failed');
            setPassword('');
        } finally {
            setLoading(false);
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
                            onChange={e => {
                                setUsername(e.target.value);
                                setError('');
                            }}
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
                            onChange={e => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            required
                        />
                        <i className="absolute right-3 top-2 text-white font-normal non-italic">🔒</i>
                    </div>
                    <button
                        disabled={loading}
                        //className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300"
                        className="w-full py-3 px-4 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-purple-600 text-white hover:bg-purple-700 focus:outline-hidden focus:bg-purple-700 focus:outline-hidden focus:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none"
                        type="submit"
                    >
                        {loading && (
                            <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent text-white rounded-full"
                                role="status"
                                aria-label="loading">
                            </span>
                        )}
                        Login
                    </button>
                    {sessionExpired && <div className="text-red-400 mt-2 mb-2">{sessionExpired}</div>}
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