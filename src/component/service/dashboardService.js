// src/services/dashboardService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/dashboard';

// Hàm helper để lấy token (giữ lại để dễ mở rộng sau này)
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Tạo một instance của axios với cấu hình sẵn
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Thêm interceptor để tự động đính kèm token vào mỗi yêu cầu
apiClient.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

/**
 * Lấy dữ liệu tổng quan (Income, Expense, NetWorth)
 * @returns {Promise<{totalIncome: number, totalExpense: number, netWorth: number}>}
 */
export const getOverviewData = async () => {
    try {
        const response = await apiClient.get('/overview');
        return response.data;
    } catch (error) {
        console.error("API Error - getOverviewData:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch overview data.');
    }
};

/**
 * Lấy danh sách tóm tắt các tài khoản
 * @returns {Promise<{accounts: Array<{accountId: number, accountName: string, balance: number}>}>}
 */
export const getAccountsSummary = async () => {
    try {
        const response = await apiClient.get('/accounts-summary');
        return response.data;
    } catch (error) {
        console.error("API Error - getAccountsSummary:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch accounts summary.');
    }
};