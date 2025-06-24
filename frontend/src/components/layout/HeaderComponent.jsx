import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { useState, useEffect, useRef } from "react";
import SidebarComponent from "./SidebarComponent";

function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HeaderComponent({ onShowProfile, onSidebarToggle, isSidebarOpen }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const full_name = sessionStorage.getItem('full_name');
    const initials = getInitials(full_name);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="h-16 bg-slate-800 text-white px-2 py-2 flex justify-between items-center shadow-md border-b border-slate-700 transition-all duration-300">

            <header className="flex justify-between items-center p-4 text-white">
                <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarOpen ? "translate-x-64" : ""}`}>
                    {!isSidebarOpen && (
                        <button
                            onClick={onSidebarToggle}
                            className="text-white text-2xl font-bold"
                        >
                            ☰
                        </button>
                    )}

                    <h1 className="font-bold text-xl">
                        SmartDoc
                    </h1>
                </div>
            </header>

            <div className="relative profile-dropdown" ref={dropdownRef}>
                <button
                    onClick={() => setOpen(!open)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600/80 hover:bg-purple-700 text-white font-medium transition-all duration-200 ring-2 ring-slate-700 hover:ring-purple-500"
                    aria-label="Open profile menu"
                >
                    {initials}
                </button>
                {open && (
                    <div className="absolute right-0 mt-2 w-60 bg-slate-800 text-white rounded-xl shadow-xl z-50 border border-slate-700 py-1 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-700">
                            <p className="text-sm font-medium text-white">{full_name}</p>
                            <p className="text-xs text-slate-400 truncate">
                                {sessionStorage.getItem('email') || 'user@example.com'}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setOpen(false)
                                onShowProfile();
                            }}
                            className="w-full flex items-center text-left px-4 py-2 text-sm hover:bg-slate-700 transition"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Your profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center text-left px-4 py-2 text-sm hover:bg-red-600/70 text-red-300 hover:text-white transition"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}