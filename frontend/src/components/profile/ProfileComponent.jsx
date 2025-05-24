import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/authService";
import ChangePasswordComponent from "./ChangePasswordComponent";

export default function  ProfileComponent() {
    const [user, setUser] = useState(null);
    const [showChangePass, setShowChangePass] = useState(false);

    useEffect(() => {
        getCurrentUser().then(setUser).catch(err => {
            console.error("Error loading the user: ", err);
        });
    }, []);

    if(!user) return <div className="p-6 text-center">Loading...</div>

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-2 border-b border-gray-600 pb-2">
                User Profile
            </h2>
            <div className="flex justify-between">
                <span className="font-semibold">Username:</span>
                <span>{user.username}</span>
            </div>
            <div className="flex justify-between">
                <span className="font-semibold">Full Name:</span>
                <span>{user.full_name}</span>
            </div>
            <div className="flex justify-between">
                <span className="font-semibold">Email:</span>
                <span>{user.email}</span>
            </div>
            {!showChangePass && (
                <button
            onClick={() => setShowChangePass(!showChangePass)}
                className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
                🔒 Change Password
            </button>
            )}
            {showChangePass && (
                <ChangePasswordComponent onClose={() => setShowChangePass(false)} />
            )}
        </div>
    )
}