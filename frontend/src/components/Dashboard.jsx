import React from 'react';
import HeaderComponent from './layout/HeaderComponent';

export default function Dashboard() {
    return (
        <>
        <HeaderComponent />  
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 to-purple-900">
            <h1 className="text-3xl text-white font-bold">Welcome to your Dashboard!</h1>
        </div>
        </>
    );
}