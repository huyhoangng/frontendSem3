// src/component/service/accountService.js

import axios from 'axios';

// API cho ACCOUNTS
const API_BASE_URL = 'https://localhost:7166/api/Accounts';

const getAuthToken = () => localStorage.getItem('authToken');

// Tên biến đúng là "apiClient"
const apiClient = axios.create({
    baseURL: API_BASE_URL,
     _getAuthHeaders(includeContentType = true) {

    const token = localStorage.getItem('authToken'); 
    
    // 2. Tạo object headers cơ bản
    const headers = {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    // 3. Nếu có token, thêm vào header Authorization
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
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
        balance: Number(apiAccount.balance),
        currency: apiAccount.currency || 'USD',
        isActive: apiAccount.isActive,
        createdAt: apiAccount.createdAt
    };
};

// Helper function to format currency based on currency type
export const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number') return '';
    const locale = currency === 'USD' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency 
    }).format(amount);
};

export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/');
        const accountsData = Array.isArray(response.data) ? response.data : [];
        // Áp dụng chuẩn hóa cho mọi account nhận về
        return accountsData.map(normalizeAccountFromApi);
    } catch (error) {
        console.error("API Error - getAccounts:", error.response?.data || error.message);
        throw error;
    }
};

export const createAccount = async (accountData) => {
    try {
        // Log the incoming data for debugging
        console.log('Creating account with data:', accountData);

        const apiPayload = {
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: null,
            balance: Number(accountData.balance),
            currency: accountData.currency || 'USD',
            isActive: true,
            accountNumber: '12345678'
        };

        // Log the payload being sent to API
        console.log('Sending payload to API:', apiPayload);

        const response = await apiClient.post('/', apiPayload);
        return normalizeAccountFromApi(response.data);
    } catch (error) {
        // Enhanced error logging
        if (error.response) {
            console.error("API Error - createAccount:", {
                status: error.response.status,
                data: error.response.data,
                validationErrors: error.response.data?.errors
            });
            // If there are validation errors, throw them in a more readable format
            if (error.response.data?.errors) {
                const validationErrors = Object.entries(error.response.data.errors)
                    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                    .join('\n');
                throw new Error(`Validation failed:\n${validationErrors}`);
            }
        }
        throw error;
    }
};

export const updateAccount = async (id, accountData) => {
    if (!id) {
        throw new Error('Account ID is required for update');
    }

    try {
        // Log the update attempt
        console.log(`Attempting to update account ${id}:`, accountData);

        const apiPayload = {
            accountId: id,
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: null,
            balance: Number(accountData.balance),
            currency: accountData.currency || 'USD',
            isActive: true,
            accountNumber: '12345678'
        };

        console.log('Sending update payload to API:', apiPayload);

        // Use the correct endpoint format
        const response = await apiClient.put(`/${id}`, apiPayload);
        
        // Log successful update
        console.log(`Successfully updated account ${id}:`, response.data);

        return normalizeAccountFromApi(response.data);
    } catch (error) {
        // Enhanced error logging
        if (error.response) {
            console.error(`API Error - updateAccount(${id}):`, {
                status: error.response.status,
                data: error.response.data,
                validationErrors: error.response.data?.errors
            });

            // Handle specific error cases
            if (error.response.status === 404) {
                throw new Error(`Account with ID ${id} not found`);
            } else if (error.response.status === 400) {
                throw new Error(`Invalid account data: ${error.response.data?.message || 'Please check your input'}`);
            } else if (error.response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
        }
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