import axios from 'axios';

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
        throw error || "Unknown error";
    }
}