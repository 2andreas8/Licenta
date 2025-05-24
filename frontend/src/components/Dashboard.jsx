import React from "react";
import { useState } from "react"
import HeaderComponent from "./layout/HeaderComponent";
import ProfileComponent from "./profile/ProfileComponent";


export default function Dashboard() {
    const [showProfile, setShowProfile] = useState(false);

    return (
        <>
        <HeaderComponent onShowProfile={() => setShowProfile(true)} />  
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 to-purple-900">
            <h1 className="text-3xl text-white font-bold">Welcome to your Dashboard!</h1>
        </div>

        {showProfile && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="relative bg-slate-800 text-white rounded-lg p-6 shadow-2xl max-w-md w-full">
                    <button
                    onClick={() => setShowProfile(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl"
                    >
                        &times;
                    </button>
                    <ProfileComponent />
                </div>
            </div>
        )}
        </>
    );
}