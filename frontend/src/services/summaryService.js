import EventBus from './EventBus';
import { EVENTS } from './events';
import axios from 'axios';
import { toast } from 'react-toastify';

const SUMMARY_API_URL = "http://localhost:8000/nlp/summary";

// global state to track if a summary is being processed
let isProcessingSummary = false;

export const generateDocumentSummary = async({ documentId }) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

    try {
        const response = await axios.post(`${SUMMARY_API_URL}/${documentId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000 // 60 seconds timeout
        });

        return response.data;
    } catch (error) {
        console.error("Error generating summary:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.detail || error.message);
        }
        throw error;
    }
};

export const initSummaryHandler = () => {
    EventBus.unsubscribe(EVENTS.SUMMARY_REQUEST);

    EventBus.subscribe(EVENTS.SUMMARY_REQUEST, async ({ documentId }) => {
        console.log(`Received summary request for document ID: ${documentId}`);
        if (isProcessingSummary) {
            toast.warning("Another summary is already being generated.");
            return;
        }

        isProcessingSummary = true;

        try {
            const result = await generateDocumentSummary({ documentId });
            EventBus.publish(EVENTS.SUMMARY_SUCCESS, result);
            toast.success("Summary generated successfully!");
        } catch (error) {
            console.error("Error generating summary:", error);
            toast.error(`Failed to generate summary: ${error.message}`);
            EventBus.publish(EVENTS.SUMMARY_ERROR, error);
        } finally {
            isProcessingSummary = false;
        }
    });
};
