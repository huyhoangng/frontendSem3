import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api';

const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const normalizeBudgetFromApi = (apiBudget) => {
    if (!apiBudget) return null;
    console.log('Raw Budget from API:', apiBudget); // Debug
    return {
        id: apiBudget.budgetId,
        budgetName: apiBudget.budgetName,
        budgetAmount: apiBudget.budgetAmount,
        budgetPeriod: apiBudget.budgetPeriod,
        startDate: apiBudget.startDate,
        endDate: apiBudget.endDate,
        spentAmount: apiBudget.spentAmount || 0,
        alertThreshold: apiBudget.alertThreshold,
        isActive: apiBudget.isActive,
        categoryId: apiBudget.categoryId,
        accountId: parseInt(apiBudget.accountId, 10) // Ensure number
    };
};

const normalizeBudgetForApi = (budgetData) => {
    const budgetAmount = parseFloat(budgetData.budgetAmount);
    const alertThreshold = parseFloat(budgetData.alertThreshold);
    const categoryId = parseInt(budgetData.categoryId, 10);
    const accountId = parseInt(budgetData.accountId, 10);
    console.log('Normalized Budget for API:', { // Debug
        budgetName: budgetData.budgetName,
        budgetAmount: isNaN(budgetAmount) ? 0 : budgetAmount,
        budgetPeriod: budgetData.budgetPeriod,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        alertThreshold: isNaN(alertThreshold) ? 80 : alertThreshold,
        categoryId: isNaN(categoryId) ? null : categoryId,
        accountId: isNaN(accountId) ? null : accountId,
        isActive: true
    });
    return {
        budgetName: budgetData.budgetName,
        budgetAmount: isNaN(budgetAmount) ? 0 : budgetAmount,
        budgetPeriod: budgetData.budgetPeriod,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        alertThreshold: isNaN(alertThreshold) ? 80 : alertThreshold,
        categoryId: isNaN(categoryId) ? null : categoryId,
        accountId: isNaN(accountId) ? null : accountId,
        isActive: true
    };
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

apiClient.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

const handleApiError = (error, context) => {
    console.error(`API Error in ${context}:`, error);
    if (error.response) {
        console.error(`[${context}] Server Response:`, JSON.stringify(error.response.data, null, 2));
        if (error.response.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Unauthorized: Your session has expired. Please log in again.');
        }
        if (error.response.status === 400) {
            const errorData = error.response.data;
            if (errorData.errors) {
                const messages = Object.values(errorData.errors).flat().join(' ');
                throw new Error(`Validation failed: ${messages}`);
            }
            if (errorData.error || errorData.message || typeof errorData === 'string') {
                throw new Error(errorData.error || errorData.message || errorData);
            }
        }
        throw new Error(error.response.data.message || `An unexpected server error occurred (${error.response.status}).`);
    } else if (error.request) {
        throw new Error('Network Error: Could not connect to the server. Please check your connection.');
    } else {
        throw new Error(error.message);
    }
};

export const getBudgets = async () => {
    try {
        const response = await apiClient.get('/budgets');
        console.log('Budgets API Response:', response.data); // Debug
        const budgetsData = Array.isArray(response.data) ? response.data : [];
        return budgetsData
            .filter(budget => budget.isActive)
            .map(normalizeBudgetFromApi);
    } catch (error) {
        handleApiError(error, 'getBudgets');
    }
};

export const createBudget = async (budgetData) => {
    try {
        const apiPayload = normalizeBudgetForApi(budgetData);
        const response = await apiClient.post('/budgets', apiPayload);
        console.log('Create Budget Response:', response.data); // Debug
        return normalizeBudgetFromApi(response.data);
    } catch (error) {
        handleApiError(error, 'createBudget');
    }
};

export const updateBudget = async (budgetId, budgetData) => {
    if (!budgetId) throw new Error('Budget ID is required for update');
    try {
        const apiPayload = normalizeBudgetForApi(budgetData);
        const response = await apiClient.put(`/budgets/${budgetId}`, apiPayload);
        console.log('Update Budget Response:', response.data); // Debug
        if (response.status === 204 || !response.data) {
            return normalizeBudgetFromApi({ budgetId, ...apiPayload, spentAmount: budgetData.spentAmount || 0 });
        }
        return normalizeBudgetFromApi(response.data);
    } catch (error) {
        handleApiError(error, `updateBudget(${budgetId})`);
    }
};

export const deleteBudget = async (budgetId) => {
    if (!budgetId) throw new Error('Budget ID is required for deletion');
    try {
        await apiClient.delete(`/budgets/${budgetId}`);
    } catch (error) {
        handleApiError(error, `deleteBudget(${budgetId})`);
    }
};

export const getBudgetAlerts = async () => {
    try {
        const response = await apiClient.get('/budgets/alerts');
        return response.data;
    } catch (error) {
        handleApiError(error, 'getBudgetAlerts');
    }
};

export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/Accounts');
        console.log('Accounts API Response:', response.data); // Debug
        const accountsData = Array.isArray(response.data) ? response.data : [];
        return accountsData
            .filter(account => account.isActive)
            .map(account => ({
                id: account.accountId,
                name: account.accountName,
                isActive: account.isActive
            }));
    } catch (error) {
        handleApiError(error, 'getAccounts');
    }
};