import axios from 'axios';

const CHAT_API_URL = "http://localhost:8000/nlp";

export const askQuestion = async({ question, fileId }) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

    try {
        const response = await axios.post(`${CHAT_API_URL}/ask`, {
            question,
            file_id: fileId
        }, {headers: {Authorization: `Bearer ${token}`}});
        return response.data;
    } catch (error) {
        console.error("Error asking question:", error);
        throw new Error("Failed to ask question");
    }
}