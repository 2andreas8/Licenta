import axios from 'axios';

const STATS_API_URL = "http://localhost:8000/analytics";

export const fetchStats = async () => {
    const token = sessionStorage.getItem("access_token");
        if (!token) {
            throw new Error("No token found");
        }
    
    try {
        const response = await axios.get(`${STATS_API_URL}/user-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error("Session expired. Please log in again.");
        }

        throw error.response?.data?.detail || error.message || "Unknown error";
    }
}