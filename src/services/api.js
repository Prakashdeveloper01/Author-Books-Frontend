import axios from 'axios';

export const API_URL = 'http://localhost:7999';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userProfile');

            // Redirect to login page
            // Using window.location.href to ensure a full reload and clear state
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/auth/login', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const signup = async (userData) => {
    const response = await api.post('/users/users', userData);
    return response.data;
};

export const sendOtp = async (email) => {
    const response = await api.post('/api/auth/send-otp', { email });
    return response.data;
};

export const verifyOtp = async (email, otpCode) => {
    const response = await api.post('/api/auth/verify-otp', { email, otpCode });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (email, otpCode, newPassword, confirmPassword) => {
    const response = await api.post('/api/auth/reset-password', {
        email,
        otpCode,
        newPassword,
        confirmPassword
    });
    return response.data;
};

export const logoutUser = async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

// --- DASHBOARD ---
export const getDashboard = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};

// --- BOOKS ---
export const createBook = async (bookData) => {
    const response = await api.post('/books', bookData);
    return response.data;
};

export const listBooks = async (filters = {}) => {
    // filters: { author_id, status }
    const params = new URLSearchParams();
    if (filters.author_id) params.append('author_id', filters.author_id);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get('/books', { params });
    return response.data;
};

export const getBook = async (uuid) => {
    const response = await api.get(`/books/${uuid}`);
    return response.data;
};

export const updateBook = async (uuid, bookData) => {
    const response = await api.put(`/books/${uuid}`, bookData);
    return response.data;
};

export const deleteBook = async (uuid) => {
    const response = await api.delete(`/books/${uuid}`);
    return response.data;
};

export const uploadBookFile = async (uuid, fileObj, fileType = 'PDF') => {
    const formData = new FormData();
    formData.append('file', fileObj); // fileObj must be a File object
    formData.append('file_type', fileType);

    const response = await api.post(`/books/${uuid}/files`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const downloadBookFile = async (uuid, fileId) => {
    // Returns a blob or handles download directly
    const response = await api.get(`/books/${uuid}/download/${fileId}`, {
        responseType: 'blob',
    });
    return response;
};

// --- REVIEWS ---
export const createReview = async (reviewData) => {
    // reviewData: { bookId, rating, comment }
    const response = await api.post('/reviews', reviewData);
    return response.data;
};

export const listReviews = async (filters = {}) => {
    // filters: { book_id, reviewer_id, status }
    const params = new URLSearchParams();
    if (filters.book_id) params.append('book_id', filters.book_id);
    if (filters.reviewer_id) params.append('reviewer_id', filters.reviewer_id);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get('/reviews', { params });
    return response.data;
};

export const updateReview = async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
};

export const deleteReview = async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
};

export default api;
