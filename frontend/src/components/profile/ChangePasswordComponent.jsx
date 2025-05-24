import React, { useState } from "react";
import { changePasswordRequest } from "../../services/authService";
import { toast } from "react-toastify"

export default function ChangePasswordComponent({ onClose }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            await changePasswordRequest(oldPassword, newPassword);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast.success("Password changed successfully");
            if (onClose) onClose();
        } catch (err) {
            setError(err?.response?.data?.detail || "Error changing the password.")
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Change password</h3>
      
            {error && <div className="text-red-400">{error}</div>}

            <input
                className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                type="passoword"
                placeholder="Old password"
                value={oldPassword}
                onChange={e => {
                    setOldPassword(e.target.value);
                    setError('');
                }}
                required
            />
            <input
                className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => {
                    setNewPassword(e.target.value);
                    setError('');
                }}
                required
            />
            <input
                className="w-full p-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => {
                    setConfirmPassword(e.target.value);
                    setError('');
                }}
                required
            />
            <button
                disabled={loading}
                className="w-full py-3 px-4 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-purple-600 text-white hover:bg-purple-700 focus:outline-hidden focus:bg-purple-700 focus:outline-hidden focus:bg-purple-700 disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
            >
                {loading && (
                    <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent text-white rounded-full"
                        role="status"
                        aria-label="loading">
                    </span>
                )}
                Submit
            </button>
            
            <button
                type="button"
                onClick={onClose}
                className="text-purple-300 hover:underline hover:text-purple-400 block mx-auto"
            >
                Cancel
            </button>
        </form>
    )
}