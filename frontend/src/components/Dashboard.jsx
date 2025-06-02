import React from "react";
import { useState } from "react"
import HeaderComponent from "./layout/HeaderComponent";
import ProfileComponent from "./profile/ProfileComponent";
import SidebarComponent from "./layout/SidebarComponent";


export default function Dashboard() {

    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl text-white font-bold mb-4">
                    Welcome to your Dashboard!
                </h1>
            </div>
        </div>
    );
}