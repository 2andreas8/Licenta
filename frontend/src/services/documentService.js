import axios from "axios";

const DOCUMENTS_API_URL = "http://localhost:8000/documents";

export const uploadDocument = async (file) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await axios.post(`${DOCUMENTS_API_URL}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`
            },
        });
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }

        throw error.response?.data?.detail || error.message || "Unknown error";
    }
};

