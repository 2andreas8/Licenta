import axios from "axios";

const CONVERSATIONS_API_URL = "http://localhost:8000/conversations";

export const createConversation = async (documentId, title = null) => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.post(`${CONVERSATIONS_API_URL}/`, 
            { document_id: documentId, title: title },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.")
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const fetchConversations = async () => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.get(`${CONVERSATIONS_API_URL}/`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.")
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const getConversation = async (conversationId) => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.get(
            `${CONVERSATIONS_API_URL}/${conversationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.")
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const getConversationMessages = async (conversationId) => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.get(`${CONVERSATIONS_API_URL}/${conversationId}/messages`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.")
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
}

export const addMessageToConversation = async (conversationId, content, role) => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.post(`${CONVERSATIONS_API_URL}/${conversationId}/messages`, 
            { content: content, role: role },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status ===401) {
            throw new Error("Session expired. Please log in again.");
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

export const deleteConversation = async (conversationId) => {
    const token = sessionStorage.getItem('access_token');
    if(!token) {
        throw new Error("No token found");
    }

    try {
        const response = await axios.delete(
            `${CONVERSATIONS_API_URL}/${conversationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        if( error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};


