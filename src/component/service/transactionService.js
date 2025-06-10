// src/services/transactionService.js

/**
 * File này chứa tất cả các hàm để giao tiếp với API Transactions.
 * Nó bao gồm các chức năng CRUD (Create, Read, Update, Delete) cho giao dịch.
 */

import axios from 'axios';

// 1. ĐỊNH NGHĨA ĐÚNG ENDPOINT API
// Đây là URL cơ sở cho TẤT CẢ các yêu cầu liên quan đến giao dịch.
const API_BASE_URL = 'https://localhost:7166/api/Transactions';

// 2. HÀM HELPER ĐỂ LẤY TOKEN
// Một nơi duy nhất để lấy token, dễ dàng thay đổi nếu sau này bạn lưu token ở nơi khác.
const getAuthToken = () => localStorage.getItem('authToken');

// 3. TẠO AXIOS INSTANCE ĐƯỢC CẤU HÌNH SẴN
// Giúp tránh lặp lại cấu hình URL và header ở mỗi hàm.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// 4. SỬ DỤNG INTERCEPTOR ĐỂ TỰ ĐỘNG THÊM TOKEN
// Đây là một kỹ thuật rất quan trọng. Nó sẽ "bắt" mọi yêu cầu trước khi gửi đi
// và tự động đính kèm token xác thực vào header.
apiClient.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        // Trả về một promise bị từ chối nếu có lỗi cấu hình
        return Promise.reject(error);
    }
);

// Add this helper function to normalize transaction data
const normalizeTransactionFromApi = (apiTransaction) => {
    return {
        id: apiTransaction.id,
        amount: apiTransaction.amount,
        transactionType: apiTransaction.transactionType,
        transactionDate: apiTransaction.transactionDate,
        description: apiTransaction.description,
        merchant: apiTransaction.merchant,
        tags: apiTransaction.tags,
        categoryId: apiTransaction.categoryId,
        categoryName: apiTransaction.categoryName,
        accountId: apiTransaction.accountId,
        accountName: apiTransaction.accountName,
        isRecurring: apiTransaction.isRecurring
    };
};

// 5. EXPORT CÁC HÀM CRUD ĐỂ COMPONENT SỬ DỤNG

/**
 * Lấy danh sách tất cả các giao dịch.
 * @returns {Promise<Array<Object>>} Một mảng các đối tượng giao dịch.
 */
export const getTransactions = async () => {
    try {
        const response = await apiClient.get('/');
        const transactionsData = Array.isArray(response.data) ? response.data : response.data.transactions || [];
        return transactionsData.map(normalizeTransactionFromApi);
    } catch (error) {
        console.error("API Error - getTransactions:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Tạo một giao dịch mới.
 * @param {Object} transactionData - Dữ liệu của giao dịch mới, phải khớp với cấu trúc API yêu cầu.
 * @returns {Promise<Object>} Đối tượng giao dịch vừa được tạo.
 */
export const createTransaction = async (transactionData) => {
    try {
        const apiPayload = {
            accountId: parseInt(transactionData.accountId, 10),
            categoryId: parseInt(transactionData.categoryId, 10),
            amount: parseFloat(transactionData.amount),
            transactionType: transactionData.transactionType,
            transactionDate: transactionData.transactionDate,
            description: transactionData.description || '',
            merchant: transactionData.merchant || '',
            tags: transactionData.tags || '',
            isRecurring: transactionData.isRecurring || false,
            recurringFrequency: transactionData.isRecurring ? (transactionData.recurringFrequency || 'Monthly') : null
        };
        const response = await apiClient.post('/', apiPayload);
        return normalizeTransactionFromApi(response.data);
    } catch (error) {
        console.error("API Error - createTransaction:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Cập nhật một giao dịch đã có.
 * @param {number | string} id - ID của giao dịch cần cập nhật.
 * @param {Object} transactionData - Dữ liệu mới để cập nhật.
 * @returns {Promise<Object>} Đối tượng giao dịch sau khi đã cập nhật.
 */
export const updateTransaction = async (id, transactionData) => {
    try {
        const apiPayload = {
            accountId: parseInt(transactionData.accountId, 10),
            categoryId: parseInt(transactionData.categoryId, 10),
            amount: parseFloat(transactionData.amount),
            transactionType: transactionData.transactionType,
            transactionDate: transactionData.transactionDate,
            description: transactionData.description || '',
            merchant: transactionData.merchant || '',
            tags: transactionData.tags || '',
            isRecurring: transactionData.isRecurring || false,
            recurringFrequency: transactionData.isRecurring ? (transactionData.recurringFrequency || 'Monthly') : null
        };
        const response = await apiClient.put(`/${id}`, apiPayload);
        return normalizeTransactionFromApi(response.data);
    } catch (error) {
        console.error(`API Error - updateTransaction(${id}):`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Xóa một giao dịch.
 * @param {number | string} id - ID của giao dịch cần xóa.
 * @returns {Promise<void>} Không trả về gì khi thành công.
 */
export const deleteTransaction = async (id) => {
    try {
        // Gửi yêu cầu DELETE đến "https://localhost:7166/api/Transactions/{id}"
        await apiClient.delete(`/${id}`);
    } catch (error)
    {
        console.error(`API Error - deleteTransaction(${id}):`, error.response?.data || error.message);
        throw error;
    }
};

// Lưu ý: Tôi không export hàm `getTransactionById` vì component hiện tại không dùng,
// nhưng nếu cần bạn có thể thêm vào như sau:
/*
export const getTransactionById = async (id) => {
    try {
        const response = await apiClient.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error(`API Error - getTransactionById(${id}):`, error.response?.data || error.message);
        throw error;
    }
};
*/