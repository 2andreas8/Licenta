import axios from 'axios';
import  { toast } from 'react-toastify';

const AUTH_API_URL = "http://localhost:8000/auth";

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
        const res = await axios.post(`${AUTH_API_URL}/login`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // salvam local tokenul
        // localStorage.setItem('access_token', res.data.access_token);
        sessionStorage.setItem('access_token', res.data.access_token);
        return res.data;
    } catch (error) {
        throw error;
    };
}

export const register = async (userData) => {
    try {
        const res = await axios.post(`${AUTH_API_URL}/register`, userData);
        return res.data;
    } catch (error) {
        throw error;
    };
}

export const getCurrentUser = async () => {
    // const token = localStorage.getItem('access_token');
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

    try {
        const res = await axios.get(`${AUTH_API_URL}/me`, {
            headers: { 
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        if (error.response?.status === 401) {
            // Token expired or invalid
            toast.error("Session expired. Please log in again.");
            sessionStorage.removeItem('access_token');
            window.location.href = "/"; // or use navigate("/") if in a React component
        }
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
}

export const logout = () => {
    // localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
}

export const changePasswordRequest = async (oldPassword, newPassword) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No token found');
    }

    try {
        const res = await axios.post(
            `${AUTH_API_URL}/change_password`,
            { old_password: oldPassword, new_password: newPassword },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error) {
        throw error.response?.data?.detail || error.message || "Unknown error";
    }
}

axios.interceptors.response.use(
    response => response,
    error => {
        const originalRequest = error.config;
        if(
            originalRequest.url.includes(`${AUTH_API_URL}/login`) ||
            originalRequest.url.includes(`${AUTH_API_URL}/register`)
        ) {
            return Promise.reject(error);
        }
        if(error.response && error.response.status === 401) {
            sessionStorage.removeItem('access_token');
            window.location.href = "/?session_expired=1";
        }
        return Promise.reject(error);
    }
)