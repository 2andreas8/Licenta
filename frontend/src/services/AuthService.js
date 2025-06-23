import axios from 'axios';
import { toast } from 'react-toastify';

const AUTH_API_URL = "http://localhost:8000/auth";

let isRefreshing = false;
let refreshSubscribers = [];

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
        sessionStorage.setItem('refresh_token', res.data.refresh_token);
        return res.data;
    } catch (error) {
        throw error;
    };
}

export const refreshToken = async () => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            refreshSubscribers.push(token => {
                resolve(token);
            });
        });
    }

    isRefreshing = true;

    try {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token found');

        const res = await axios.post(`${AUTH_API_URL}/refresh`, {
            refresh_token: refreshToken
        });
        console.log("Refresh response:", res.data);

        sessionStorage.setItem('access_token', res.data.access_token);
        sessionStorage.setItem('refresh_token', res.data.refresh_token);
        isRefreshing = false;
        refreshSubscribers.forEach(subscriber => subscriber(res.data.access_token));
        refreshSubscribers = [];
        return res.data.access_token;
    } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        throw error;
    }
}

export const register = async (userData) => {
    try {
        const res = await axios.post(`${AUTH_API_URL}/register`, userData);
        return res.data;
    } catch (error) {
        throw error;
    }
}

export const getCurrentUser = async () => {
    // const token = localStorage.getItem('access_token');
    const token = sessionStorage.getItem('access_token');
    if (!token) {
        throw new Error('No access token found');
    }

    try {
        const res = await axios.get(`${AUTH_API_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        return res.data;
    } catch (error) {
        throw error;
    }
}

export const logout = () => {
    // localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
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
    async error => {
        const originalRequest = error.config;
        if (
            !error.response ||
            error.response.status !== 401 ||
            originalRequest.url.includes(`${AUTH_API_URL}/refresh`) ||
            originalRequest.url.includes(`${AUTH_API_URL}/login`) ||
            originalRequest.url.includes(`${AUTH_API_URL}/register`
            )
        ) {
            return Promise.reject(error);
        }

        console.log("Token expired, attempting to refresh...");
        if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await refreshToken();

                const token = sessionStorage.getItem('access_token');
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axios(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                window.location.href = "/?session_expired=1";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)