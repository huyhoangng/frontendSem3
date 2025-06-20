// src/service/investmentService.js
import axios from 'axios';

// Cấu hình base URL cho API investments
const API_URL = 'https://localhost:7166/api/Investments';

// Tạo axios instance với cấu hình mặc định
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor để tự động thêm token xác thực vào mỗi request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Lấy danh sách tất cả các khoản đầu tư
 */
export const getInvestments = () => {
    return apiClient.get('/');
};

/**
 * Lấy dữ liệu tổng hợp về các khoản đầu tư
 */
export const getInvestmentSummary = () => {
    return apiClient.get('/summary');
};

/**
 * Thêm một khoản đầu tư mới
 * @param {object} investmentData
 */
export const addInvestment = (investmentData) => {
    return apiClient.post('/', investmentData);
};

/**
 * Cập nhật một khoản đầu tư đã có bằng ID
 * @param {number} id - ID của khoản đầu tư cần cập nhật
 * @param {object} investmentData - Dữ liệu mới của khoản đầu tư
 */
export const updateInvestment = (id, investmentData) => {
    if (!id) {
        return Promise.reject(new Error('Investment ID is required for update.'));
    }
    return apiClient.put(`/${id}`, investmentData);
};

/**
 * Xóa một khoản đầu tư theo ID
 * @param {number} id - ID của khoản đầu tư
 */
export const deleteInvestment = (id) => {
    if (!id) {
        return Promise.reject(new Error('Investment ID is required for deletion.'));
    }
    return apiClient.delete(`/${id}`);
};

/**
 * Lấy thông tin chi tiết của một khoản đầu tư theo ID
 * @param {number} id - ID của khoản đầu tư
 */
export const getInvestmentById = (id) => {
    return apiClient.get(`/${id}`);
};