import React from 'react';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 shadow-md flex flex-col items-center">
        <div className="text-3xl mb-2 text-purple-400">{icon}</div>
        <h3 className="text-slate-300 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
);

export default StatCard;