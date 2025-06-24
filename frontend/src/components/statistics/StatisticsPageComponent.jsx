import React, { useEffect, useState } from 'react';
import { fetchStats } from '../../services/StatsService';
import StatCard from './cards/StatCard';
import InsightCard from './cards/InsightCard';
import DocumentUsageChart from './charts/DocumentUsageChart';
import EventBus from '../../services/EventBus';
import { EVENTS } from '../../services/events';

export default function StatisticsPageComponent() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await fetchStats();
            setStats(data);
        } catch (error) {
            setError(error.toString());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        const unsubscribeDoc = EventBus.subscribe(EVENTS.DOCUMENT_DELETED, () => {
            loadStats();
        });

        const unsubscribeConv = EventBus.subscribe(EVENTS.DATA_REFRESH_NEEDED, () => {
            loadStats();
        });

        return () => {
            unsubscribeDoc();
            unsubscribeConv();
        };
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
    );
    if (error) return <div className="text-red-400 p-4 text-center">{error}</div>;
    if (!stats) return <div className="text-white text-center">No available data.</div>;

    return (
        <div className='container mx-auto px-4 py-6'>
            <div className="mb-8">
                <h1 className="text-3xl font-light text-white mb-2">
                    Your <span className="font-bold">Statistics</span>
                </h1>
                <p className="text-gray-300">Track your activity and document usage</p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                <StatCard
                    title="Documents"
                    value={stats.documents_count}
                    icon="📄"
                    color="bg-blue-100"
                />
                <StatCard
                    title="Conversations"
                    value={stats.conversations_count}
                    icon="💬"
                    color="bg-green-100"
                />
                <StatCard
                    title="Questions"
                    value={stats.questions_count}
                    icon="❓"
                    color="bg-yellow-100"
                />
                <StatCard
                    title="Average Response Time"
                    value={`${(stats.avg_response_time_ms / 1000).toFixed(2)}s`}
                    icon="⏱️"
                    color="bg-purple-100"
                />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='md:col-span-2 bg-gradient-to-br from-purple-900/30 to-slate-800/80 rounded-xl p-6 backdrop-blur-sm border border-purple-800/20 shadow-xl'>
                    <h2 className='text-xl text-white font-semibold mb-4 flex items-center'>
                        <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Document usage
                    </h2>
                    <DocumentUsageChart data={stats.document_usage} />
                </div>

                <div className='bg-gradient-to-br from-purple-900/30 to-slate-800/80 rounded-xl p-6 backdrop-blur-sm border border-purple-800/20 shadow-xl'>
                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Insights
                    </h2>
                    <div className='space-y-4'>
                        <InsightCard
                            title="Most Active Day"
                            value={stats.most_active_day ?
                                new Date(stats.most_active_day).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                        />
                        <InsightCard
                            title="Most used Document"
                            value={stats.documents_count > 0
                                ? `${(stats.conversations_count / stats.documents_count).toFixed(1)} conversations/doc`
                                : 'N/A'}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}