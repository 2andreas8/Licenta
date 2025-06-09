import React, { useEffect, useState } from 'react';
import { fetchStats } from '../../services/StatsService';
import StatCard from './cards/StatCard';
import InsightCard from './cards/InsightCard';
import DocumentUsageChart from './charts/DocumentUsageChart';

export default function StatisticsPageComponent() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

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

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
    );
    if (error) return <div className="text-red-400 p-4 text-center">{error}</div>;
    if (!stats) return <div className="text-white text-center">No available data.</div>;

    return (
        <div className='container mx-auto px-4 py-6'>
            <h1 className="text-3xl font-bold text-white mb-6">Statistics</h1>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
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
                <div className='md:col-span-2 bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm border border-white border-opacity-20'>
                    <h2 className='text-xl text-white font-semibold mb-4'>Document usage</h2>
                    <DocumentUsageChart data={stats.document_usage} />
                </div>

                <div className='bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm border border-white border-opacity-20'>
                    <h2 className="text-xl font-semibold mb-4 text-white">Insights</h2>
                    <div className='space-y-4'>
                        <InsightCard
                            title="Most Active Day"
                            value={stats.most_active_day ? 
                                new Date(stats.most_active_day).toLocaleDateString('en-US' , {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                        />
                        <InsightCard
                            title="Most used Document"
                            value={stats.documents_count > 0 
                                        ? `${(stats.conversations_count / stats.documents_count).toFixed(1)} conversații/doc` 
                                        : 'N/A'}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}