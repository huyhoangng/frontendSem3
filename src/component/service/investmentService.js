// src/service/investmentService.js
import axios from 'axios';

// Cấu hình base URL
const API_BASE_URL = 'https://localhost:7166/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor để tự động thêm token xác thực
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- Investment APIs ---
export const getInvestments = () => apiClient.get('/Investments/');
export const getInvestmentSummary = () => apiClient.get('/Investments/summary');
export const addInvestment = (data) => apiClient.post('/Investments/', data);
export const updateInvestment = (id, data) => apiClient.put(`/Investments/${id}`, data);
export const deleteInvestment = (id) => apiClient.delete(`/Investments/${id}`);
export const getInvestmentById = (id) => apiClient.get(`/Investments/${id}`);

// --- MỚI: Account API (Lấy danh sách tài khoản để chọn) ---
/**
 * Lấy danh sách tất cả các tài khoản của người dùng
 */
export const getAccounts = () => {
    // API này gọi đến một controller khác, nhưng dùng chung apiClient
    return apiClient.get('/Accounts'); 
};