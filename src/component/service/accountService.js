// src/component/service/accountService.js

import axios from 'axios';

// API cho ACCOUNTS
const API_BASE_URL = 'https://localhost:7166/api/Accounts';

const getAuthToken = () => localStorage.getItem('authToken');

// Tên biến đúng là "apiClient"
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Sử dụng interceptor với "apiClient"
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

// Helper function to normalize account data from API
const normalizeAccountFromApi = (apiAccount) => {
    return {
        id: apiAccount.accountId,
        name: apiAccount.accountName,
        type: apiAccount.accountType,
        bankName: apiAccount.bankName,
        currency: apiAccount.currency,
        balance: apiAccount.balance,
        isActive: apiAccount.isActive,
        createdAt: apiAccount.createdAt
    };
};

// --- Hàm export cho ACCOUNTS ---

export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/');
        const accountsData = Array.isArray(response.data) ? response.data : response.data.accounts || [];
        return accountsData.map(normalizeAccountFromApi);
    } catch (error) {
        console.error("API Error - getAccounts:", error.response?.data || error.message);
        throw error;
    }
};

export const createAccount = async (accountData) => {
    try {
        const apiPayload = {
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: accountData.bankName,
            currency: accountData.currency,
            balance: accountData.balance,
            isActive: accountData.isActive
        };
        const response = await apiClient.post('/', apiPayload);
        return normalizeAccountFromApi(response.data);
    } catch (error) {
        console.error("API Error - createAccount:", error.response?.data || error.message);
        throw error;
    }
};

export const updateAccount = async (id, accountData) => {
    try {
        const apiPayload = {
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: accountData.bankName,
            currency: accountData.currency,
            balance: accountData.balance,
            isActive: accountData.isActive
        };
        const response = await apiClient.put(`/${id}`, apiPayload);
        return normalizeAccountFromApi(response.data);
    } catch (error) {
        console.error(`API Error - updateAccount(${id}):`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteAccount = async (id) => {
    try {
        await apiClient.delete(`/${id}`);
    } catch (error) {
        console.error(`API Error - deleteAccount(${id}):`, error.response?.data || error.message);
        throw error;
    }
};