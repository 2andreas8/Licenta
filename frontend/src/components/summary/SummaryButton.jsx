import React, { useState, useEffect } from 'react';
import EventBus from '../../services/EventBus';
import { EVENTS } from '../../services/events';

export default function SummaryButton({ documentId, className = '' }) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const successUnsubscribe = EventBus.subscribe(EVENTS.SUMMARY_SUCCESS, () => {
            setLoading(false);
        });

        const failureUnsubscribe = EventBus.subscribe(EVENTS.SUMMARY_ERROR, () => {
            setLoading(false);
        });

        return () => {
            successUnsubscribe();
            failureUnsubscribe();
        };
    }, []);

    const handleClick = async () => {
        console.log(`Requesting summary for document ID: ${documentId}`);
        setLoading(true);
        EventBus.publish(EVENTS.SUMMARY_REQUEST, { documentId });
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Summarizing...
                </>
            ) : (
                <>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Summarize
                </>
            )}
        </button>
    );
}