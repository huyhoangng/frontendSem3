import axios from 'axios';

// API cho ACCOUNTS
const API_BASE_URL = 'https://localhost:7166/api/Accounts';

const getAuthToken = () => localStorage.getItem('authToken');

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Sử dụng interceptor với "apiClient"
apiClient.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('=== API Request ===', {
            method: config.method.toUpperCase(),
            url: config.url,
            data: config.data
        });
        return config;
    },
    error => Promise.reject(error)
);

// Helper function to normalize account data from API
const normalizeAccountFromApi = (apiAccount) => {
    console.log('=== Normalizing API Account ===', apiAccount);
    const balance = parseFloat(apiAccount.balance) || 0; // Use 'balance' from response
    if (apiAccount.balance && balance === 0 && apiAccount.balance !== 0) {
        console.warn('API returned balance as 0, possible backend issue');
    }
    return {
        id: apiAccount.accountId,
        name: apiAccount.accountName,
        type: apiAccount.accountType,
        bankName: apiAccount.bankName,
        balance: balance,
        currency: apiAccount.currency || 'USD',
        isActive: apiAccount.isActive,
        createdAt: apiAccount.createdAt
    };
};

// Helper function to format currency based on currency type
export const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
    const locale = currency === 'USD' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency 
    }).format(amount);
};

export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/');
        console.log('=== Get Accounts Response ===', response.data);
        const accountsData = Array.isArray(response.data) ? response.data : [];
        return accountsData.map(normalizeAccountFromApi);
    } catch (error) {
        console.error("API Error - getAccounts:", error.response?.data || error.message);
        throw error;
    }
};

export const createAccount = async (accountData) => {
    try {
        console.log('=== Creating Account: Input Data ===', accountData);
        const balance = parseFloat(accountData.balance).toFixed(2);
        if (isNaN(balance) || balance <= 0) {
            throw new Error('Invalid balance: Must be a positive number');
        }

        const apiPayload = {
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: accountData.bankName || null,
            initialBalance: parseFloat(balance), // Send 'initialBalance' in request
            currency: accountData.currency || 'USD',
            isActive: true,
            accountNumber: accountData.accountNumber || '123456789',
            creditLimit: 0
        };

        console.log('=== Sending Payload to API ===', apiPayload);
        const response = await apiClient.post('/', apiPayload);
        console.log('=== Create Account Response ===', response.data);
        const normalizedAccount = normalizeAccountFromApi(response.data);
        if (normalizedAccount.balance === 0 && parseFloat(balance) !== 0) {
            throw new Error('API returned balance as 0, please check backend configuration');
        }
        return normalizedAccount;
    } catch (error) {
        if (error.response) {
            console.error("=== API Error - createAccount ===", {
                status: error.response.status,
                data: error.response.data,
                validationErrors: error.response.data?.errors
            });
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
        console.log(`=== Updating Account ${id}: Input Data ===`, accountData);
        const balance = parseFloat(accountData.balance).toFixed(2);
        if (isNaN(balance) || balance < 0) {
            throw new Error('Invalid balance: Must be a non-negative number');
        }

        const apiPayload = {
            accountId: id,
            accountName: accountData.name,
            accountType: accountData.type,
            bankName: accountData.bankName || null,
            initialBalance: parseFloat(balance), // Send 'initialBalance' in request
            currency: accountData.currency || 'USD',
            isActive: true,
            accountNumber: accountData.accountNumber || '123456789',
            creditLimit: 0
        };

        console.log('=== Sending Update Payload to API ===', apiPayload);
        const response = await apiClient.put(`/${id}`, apiPayload);
        console.log(`=== Successfully Updated Account ${id} ===`, response.data);
        return normalizeAccountFromApi(response.data);
    } catch (error) {
        if (error.response) {
            console.error(`=== API Error - updateAccount(${id}) ===`, {
                status: error.response.status,
                data: error.response.data,
                validationErrors: error.response.data?.errors
            });
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