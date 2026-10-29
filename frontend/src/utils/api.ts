import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to inject JWT Auth Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor to globally handle expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Wipe token on bad access
            localStorage.removeItem('token');
            // If we are strictly not on the login page already
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';            
            }
        }
        return Promise.reject(error);
    }
);

export default api;
