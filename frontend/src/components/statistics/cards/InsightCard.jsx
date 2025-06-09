import React from 'react';

const InsightCard = ({ title, value }) => (
    <div className="p-4 bg-white bg-opacity-5 rounded-lg">
        <h3 className="font-medium text-purple-200">{title}</h3>
        <p className="text-lg mt-2 text-white">{value}</p>
    </div>
);

export default InsightCard;