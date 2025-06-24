import React from 'react';

const InsightCard = ({ title, value }) => (
    <div className="p-4 bg-slate-700/40 hover:bg-slate-700/60 transition-colors rounded-lg border border-slate-600/30">
        <h3 className="font-medium text-purple-300">{title}</h3>
        <p className="text-lg mt-2 text-white">{value}</p>
    </div>
);

export default InsightCard;