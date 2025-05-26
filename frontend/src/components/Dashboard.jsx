import React from "react";
import { useState } from "react"
import HeaderComponent from "./layout/HeaderComponent";
import ProfileComponent from "./profile/ProfileComponent";
import SidebarComponent from "./layout/SidebarComponent";


export default function Dashboard() {

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 to-purple-900">
            <h1 className="text-3xl text-white font-bold">Welcome to your Dashboard!</h1>
        </div>
    );
}