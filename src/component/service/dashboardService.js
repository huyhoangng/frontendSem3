// src/service/dashboardService.js (hoặc investmentService.js)
import axios from 'axios';

// Định nghĩa API URL cơ sở
const API_BASE_URL = 'https://localhost:7166/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor để gắn token vào mỗi request
apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Interceptor để xử lý lỗi response, đặc biệt là lỗi 401
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.error("Authentication Error: Token is invalid or expired. Logging out.");
            localStorage.removeItem('authToken');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


// --- CÁC HÀM SERVICE ---

export const getOverviewData = async () => {
    try {
        const response = await apiClient.get('/dashboard/overview');
        return response.data;
    } catch (error) {
        console.error('Error fetching overview data:', error.message);
        throw error;
    }
};

export const getAccountsSummary = async () => {
    try {
        const response = await apiClient.get('/dashboard/accounts-summary');
        return response.data;
    } catch (error) {
        console.error('Error fetching accounts summary:', error.message);
        throw error;
    }
};

/**
 * Lấy dữ liệu tóm tắt chi tiêu theo danh mục.
 * ĐÃ SỬA: Luôn đảm bảo trả về một mảng.
 */
export const getTransactionSummary = async () => {
    try {
        const response = await apiClient.get('/Transactions/summary');
        
        // Nếu API trả về trực tiếp một mảng
        if (Array.isArray(response.data)) {
            return response.data;
        }

        // Nếu API trả về một object có chứa mảng (ví dụ: { items: [...] })
        if (response.data && Array.isArray(response.data.items)) {
            return response.data.items;
        }

        // Nếu không tìm thấy mảng nào, ghi lại cảnh báo và trả về mảng rỗng
        console.warn("API for transaction summary did not return an array.", response.data);
        return [];

    } catch (error) {
        console.error('Error fetching transaction summary:', error.message);
        throw error;
    }
};

/**
 * Lấy danh sách các giao dịch gần đây.
 * ĐÃ SỬA: Luôn đảm bảo trả về một mảng để bảng không bị lỗi.
 */
export const getRecentTransactions = async () => {
    try {
        const response = await apiClient.get('/Transactions');

        // Nếu API trả về trực tiếp một mảng
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        // Nếu API trả về một object có chứa mảng (ví dụ: { items: [...] } hoặc { data: [...] })
        if (response.data && Array.isArray(response.data.items)) {
            return response.data.items;
        }
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        // Nếu không tìm thấy mảng, ghi lại cảnh báo và trả về mảng rỗng
        console.warn("API for recent transactions did not return an array.", response.data);
        return [];

    } catch (error) {
        console.error('Error fetching recent transactions:', error.message);
        throw error;
    }
};