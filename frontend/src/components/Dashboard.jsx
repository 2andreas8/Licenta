import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLatestConversation, fetchRecommendedDocuments } from "../services/StatsService";

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [workInProgress, setWorkInProgress] = useState(null);
    const [documentSuggestion, setDocumentSuggestion] = useState(null);

    const userName = sessionStorage.getItem('full_name') || 'User';
    const firstName = userName.split(' ')[0];

    function getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.round(diffMs / 1000);
        const diffMins = Math.round(diffSecs / 60);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffSecs < 60) {
            return `Just now`;
        } else if (diffMins < 60) {
            return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        } else {
            return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        }
    }

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            setError(null);

            // fetch at the same time for better performance
            try {
                const [latestConvo, recommendedDocs] = await Promise.all([
                    fetchLatestConversation(),
                    fetchRecommendedDocuments()
                ]);

                // Process results
                if (latestConvo) {
                    setWorkInProgress({
                        document: latestConvo.document,
                        lastQuestion: latestConvo.lastQuestion,
                        timeAgo: formatTimeAgo(new Date(latestConvo.timeAgo)),
                        id: latestConvo.id
                    });
                }

                if (recommendedDocs && recommendedDocs.length > 0) {
                    setDocumentSuggestion(recommendedDocs[0]);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err.message || "Could not load dashboard data");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
        // eslint-disable-next-line
    }, []);

    // Remove or define dailyInsight to avoid errors
    // For now, let's remove its usage to fix the error

    return (
        <div className="w-full flex flex-col">
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
            ) : error ? (
                <div className="p-6 text-center">
                    <div className="text-red-400 mb-4">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="p-6 w-full max-w-screen-xl mx-auto">
                    {/* Time-based greeting - moved above the workspace */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-light text-white">
                            {getTimeBasedGreeting()}, <span className="font-bold">{userName}</span>
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-purple-800/20 shadow-xl mb-8">
                        <h2 className="text-2xl font-bold text-white mb-5 flex items-center">
                            <svg className="w-6 h-6 mr-3 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Your Workspace
                        </h2>

                        {workInProgress ? (
                            <div className="mb-6">
                                <div className="text-sm text-purple-300 uppercase tracking-wider mb-2">Continue where you left off</div>
                                <div
                                    onClick={() => navigate(`/chat/${workInProgress.id}`)}
                                    className="bg-slate-800/80 hover:bg-slate-700/80 p-5 rounded-xl border border-slate-700/50 cursor-pointer transition-all flex items-start"
                                >
                                    <div className="bg-slate-700/70 p-3 rounded-lg mr-4">
                                        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white">
                                            {workInProgress.document}
                                        </h3>
                                        <p className="text-slate-300 mt-1">
                                            "{workInProgress.lastQuestion}"
                                        </p>
                                        <div className="text-sm text-slate-400 mt-3">
                                            {workInProgress.timeAgo}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div
                                    onClick={() => navigate('/chat/new')}
                                    className="bg-slate-800/80 hover:bg-slate-700/80 p-5 rounded-xl border border-slate-700/50 cursor-pointer transition-all flex items-center justify-center"
                                >
                                    <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span className="text-lg font-medium text-white">Start a new conversation</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Removed dailyInsight block to avoid reference error */}
                            {documentSuggestion && (
                                <div
                                    onClick={() => navigate(`/chat/${documentSuggestion.id}`)}
                                    className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-700/60 transition-colors"
                                >
                                    <div className="text-sm text-purple-300 uppercase tracking-wider mb-2">Recommended for you</div>
                                    <div className="flex items-center">
                                        <svg className="w-8 h-8 text-slate-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div>
                                            <div className="text-white text-lg font-medium">
                                                {documentSuggestion.filename}
                                            </div>
                                            <div className="text-slate-400 text-sm">
                                                {documentSuggestion.reason}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
