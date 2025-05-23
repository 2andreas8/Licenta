import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import { useState } from "react";

export default function HeaderComponent() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow">
            { /* titlu */ }
            <h1 className="font-bold text-xl">
                DocHelp    
            </h1>    

            <div className="relative">
                <span
                    onClick={() => setOpen(!open)}
                    className="cursor-pointer w-10 hh-10 rounded-full bg-gray-600 text-white flex items-center justify-center font-semibold select-none"
                >
                    AC
                </span>
                {open && (
                    <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                            Logout
                        </button>
                    </div>

                )}
            </div>
        </nav>
    )
}