// src/service/transactionService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/Transactions';
const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Hàm chuẩn hóa dữ liệu trả về từ API để component dễ dàng sử dụng
const normalizeTransaction = (apiTransaction) => ({
    id: apiTransaction.transactionId || apiTransaction.id,
    amount: apiTransaction.amount,
    transactionType: apiTransaction.transactionType,
    transactionDate: apiTransaction.transactionDate,
    description: apiTransaction.description,
    merchant: apiTransaction.merchant,
    tags: apiTransaction.tags,
    accountId: apiTransaction.accountId,
    accountName: apiTransaction.accountName, // Giữ lại accountName nếu API trả về
    categoryId: apiTransaction.categoryId,
    categoryName: apiTransaction.categoryName,
    isRecurring: apiTransaction.isRecurring,
    recurringFrequency: apiTransaction.recurringFrequency
});

// Hàm chuẩn bị dữ liệu để gửi lên API
const createApiPayload = (transactionData) => ({
    accountId: parseInt(transactionData.accountId, 10),
    categoryId: parseInt(transactionData.categoryId, 10),
    amount: parseFloat(transactionData.amount),
    transactionType: transactionData.transactionType,
    transactionDate: transactionData.transactionDate,
    description: transactionData.description || '',
    tags: transactionData.tags || '',
    isRecurring: transactionData.isRecurring || false,
    recurringFrequency: transactionData.isRecurring ? transactionData.recurringFrequency : null
});

export const getTransactions = async () => {
    try {
        const response = await apiClient.get('/');
        const transactionsData = Array.isArray(response.data) ? response.data : [];
        return transactionsData.map(normalizeTransaction);
    } catch (error) {
        console.error("API Error - getTransactions:", error.response?.data || error.message);
        throw error;
    }
};

export const createTransaction = async (transactionData) => {
    try {
        const response = await apiClient.post('/', createApiPayload(transactionData));
        return normalizeTransaction(response.data);
    } catch (error) {
        console.error("API Error - createTransaction:", error.response?.data || error.message);
        throw error;
    }
};

export const updateTransaction = async (id, transactionData) => {
    try {
        const response = await apiClient.put(`/${id}`, createApiPayload(transactionData));
        return response.status === 204 ? null : normalizeTransaction(response.data);
    } catch (error) {
        console.error(`API Error - updateTransaction(${id}):`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteTransaction = async (id) => {
    try {
        await apiClient.delete(`/${id}`);
    } catch (error) {
        console.error(`API Error - deleteTransaction(${id}):`, error.response?.data || error.message);
        throw error;
    }
};