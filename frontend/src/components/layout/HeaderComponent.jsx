import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { useState } from "react";

function getInitials(name) {
    if(!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HeaderComponent({ onShowProfile }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    
    const full_name = sessionStorage.getItem('full_name');
    const initials = getInitials(full_name);

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-indigo-950 text-white px-6 py-4 flex justify-between items-center shadow">
            { /* titlu */ }
            <h1 className="font-bold text-xl">
                DocHelp    
            </h1>    

            <div className="relative">
                <span
                    onClick={() => setOpen(!open)}
                    className="cursor-pointer w-10 hh-10 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center font-semibold select-none hover:bg-gray-800 text-white"
                >
                    {initials}
                </span>
                {open && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 text-white rounded-xl shadow-xl z-50 border border-slate-700">
                        <button
                        onClick={() => {
                            setOpen(false)
                            onShowProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-t-xl transition"
                        >
                            👤 Your profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-600 text-red-300 hover:text-white rounded-b-xl transition"
                        >
                            ⍈ Logout
                        </button>
                    </div>

                )}
            </div>
        </nav>
    )
}