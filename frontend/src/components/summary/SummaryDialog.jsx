import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import EventBus from '../../services/EventBus';
import { EVENTS } from '../../services/events';

export default function SummaryDialog({ }) {
    const [summary, setSummary] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const successSubscription = EventBus.subscribe(EVENTS.SUMMARY_SUCCESS, (summaryData) => {
            setSummary(summaryData);
            setIsOpen(true);
        });

        const errorSubscription = EventBus.subscribe(EVENTS.SUMMARY_ERROR, () => {
            // Handle error if needed
        });

        return () => {
            successSubscription();
            errorSubscription();
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => setSummary(null), 300);
    };

    const handleCopy = () => {
        if (!summary || !summary.summary) return;

        navigator.clipboard.writeText(summary.summary);
        toast.success("Summary copied to clipboard!");
    };

    // Markdown components
    const markdownComponents = {
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-purple-300 mt-5 mb-3 pb-2 border-b border-purple-500/30" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-purple-300 mt-4 mb-2 flex items-center" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>
            {props.children}
        </h2>,
        h3: ({ node, ...props }) => <h3 className="text-base font-medium text-purple-200 mt-3 mb-1.5" {...props} />,
        p: ({ node, ...props }) => <p className="my-2 text-gray-200 leading-relaxed" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-3 space-y-1.5 text-gray-200" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-3 space-y-1.5 text-gray-200" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold text-purple-200" {...props} />,
        em: ({ node, ...props }) => <em className="text-purple-200 italic" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500 bg-slate-700/50 pl-4 py-2 italic text-gray-200 my-3 rounded-r" {...props} />,
        code: ({ node, inline, ...props }) =>
            inline ?
                <code className="bg-slate-700 text-purple-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props} /> :
                <code className="block bg-slate-700/70 p-3 rounded-md my-3 font-mono overflow-x-auto text-sm border border-slate-600/50 text-purple-100" {...props} />,
    };

    if (!isOpen || !summary) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-slate-800 rounded-xl shadow-2xl w-4/5 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-800/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-purple-700 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <svg className="h-5 w-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-white truncate">
                            Summary: {summary?.document_title || 'Document'}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-purple-200/70 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="custom-scrollbar px-6 py-5 overflow-auto flex-grow bg-gradient-to-b from-slate-900 to-slate-800">
                    <div className="p-5 bg-slate-800/80 rounded-lg border border-purple-900/30 shadow-inner">
                        <div className="prose-sm max-w-none">
                            <ReactMarkdown components={markdownComponents}>
                                {summary.summary}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-purple-900/30 px-6 py-3 flex justify-between items-center bg-slate-800/90">
                    <div className="text-sm text-purple-200/70">
                        <div className="text-sm text-purple-200/70">
                            {summary?.metrics && (
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center">
                                        <svg className="h-4 w-4 text-purple-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span>{summary.metrics.chunk_count} chunks</span>
                                    </div>
                                    {summary.metrics.processing_time_seconds && (
                                        <div className="flex items-center">
                                            <svg className="h-4 w-4 text-purple-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{summary.metrics.processing_time_seconds}s</span>
                                        </div>
                                    )}
                                    {/* Adaugă indicatorul de cache aici */}
                                    {summary.metrics.cached && (
                                        <div className="flex items-center">
                                            <svg className="h-4 w-4 text-green-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-green-300">
                                                Cached {summary.metrics.generated_at &&
                                                    `(${new Date(summary.metrics.generated_at).toLocaleString()})`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 text-sm border border-purple-500/50 hover:bg-purple-900/40 text-purple-300 rounded-md transition-colors flex items-center"
                        >
                            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}