// src/component/service/budgetService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/budgets';

const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No valid authentication token found. Please log in.');
    }
    return token;
};

// Helper function to normalize budget data from API
const normalizeBudgetFromApi = (apiBudget) => {
    return {
        id: apiBudget.budgetId,
        budgetName: apiBudget.budgetName,
        budgetAmount: apiBudget.budgetAmount,
        budgetPeriod: apiBudget.budgetPeriod,
        startDate: apiBudget.startDate,
        endDate: apiBudget.endDate,
        spentAmount: apiBudget.spentAmount,
        alertThreshold: apiBudget.alertThreshold,
        isActive: apiBudget.isActive,
        categoryId: apiBudget.categoryId
    };
};

// Helper function to normalize budget data for API
const normalizeBudgetForApi = (budgetData) => {
    return {
        budgetName: budgetData.budgetName,
        budgetAmount: budgetData.budgetAmount,
        budgetPeriod: budgetData.budgetPeriod,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        alertThreshold: budgetData.alertThreshold,
        categoryId: budgetData.categoryId,
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
    error => {
        return Promise.reject(error);
    }
);

export const getBudgets = async () => {
    try {
        const response = await apiClient.get('/');
        const budgetsData = Array.isArray(response.data) ? response.data : [];
        return budgetsData
            .filter(budget => budget.isActive)
            .map(normalizeBudgetFromApi);
    } catch (error) {
        console.error("API Error - getBudgets:", error.response?.data || error.message);
        throw error;
    }
};

export const createBudget = async (budgetData) => {
    try {
        const apiPayload = normalizeBudgetForApi(budgetData);
        const response = await apiClient.post('/', apiPayload);
        return normalizeBudgetFromApi(response.data);
    } catch (error) {
        console.error("API Error - createBudget:", error.response?.data || error.message);
        throw error;
    }
};

export const updateBudget = async (budgetId, budgetData) => {
    if (!budgetId) {
        throw new Error('Budget ID is required for update');
    }

    try {
        // Log the update attempt
        console.log(`Attempting to update budget ${budgetId}:`, budgetData);

        const apiPayload = normalizeBudgetForApi(budgetData);
        const response = await apiClient.put(`/${budgetId}`, apiPayload);

        // Log successful update
        console.log(`Successfully updated budget ${budgetId}:`, response.data);

        return normalizeBudgetFromApi(response.data);
    } catch (error) {
        // Enhanced error logging
        if (error.response) {
            console.error(`API Error - updateBudget(${budgetId}):`, {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });

            // Handle specific error cases
            if (error.response.status === 404) {
                throw new Error(`Budget with ID ${budgetId} not found`);
            } else if (error.response.status === 400) {
                throw new Error(`Invalid budget data: ${error.response.data?.message || 'Please check your input'}`);
            } else if (error.response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }
        }
        throw error;
    }
};

export const deleteBudget = async (budgetId) => {
    if (!budgetId) {
        throw new Error('Budget ID is required for deletion');
    }

    try {
        // Log the delete attempt
        console.log(`Attempting to delete budget ${budgetId}`);

        // First, verify the budget exists
        try {
            await apiClient.get(`/${budgetId}`);
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Budget with ID ${budgetId} not found`);
            }
            throw error;
        }

        // Proceed with deletion
        const response = await apiClient.delete(`/${budgetId}`);

        // Log successful deletion
        console.log(`Successfully deleted budget ${budgetId}`);

        return response.data;
    } catch (error) {
        // Enhanced error logging
        if (error.response) {
            console.error(`API Error - deleteBudget(${budgetId}):`, {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });

            // Handle specific error cases
            if (error.response.status === 404) {
                throw new Error(`Budget with ID ${budgetId} not found`);
            } else if (error.response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (error.response.status === 403) {
                throw new Error('You do not have permission to delete this budget');
            }
        }
        throw error;
    }
};