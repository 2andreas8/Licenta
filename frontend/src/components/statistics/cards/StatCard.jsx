import React from 'react';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white bg-opacity-10 rounded-xl p-5 backdrop-blur-sm border border-white border-opacity-20 flex flex-col items-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="text-gray-200 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
);

export default StatCard;