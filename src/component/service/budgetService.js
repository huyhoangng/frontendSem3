// src/service/budgetService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/budgets';

// Helper để lấy token, nếu không có sẽ báo lỗi
const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Ném lỗi này sẽ được bắt bởi interceptor hoặc hàm gọi
        throw new Error('No valid authentication token found. Please log in.');
    }
    return token;
};

// Chuẩn hóa dữ liệu nhận từ API sang dạng mà Frontend muốn dùng
const normalizeBudgetFromApi = (apiBudget) => {
    return {
        id: apiBudget.budgetId, // Đổi budgetId -> id
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

// Chuẩn hóa dữ liệu từ form ở Frontend sang dạng mà API yêu cầu
const normalizeBudgetForApi = (budgetData) => {
    return {
        budgetName: budgetData.budgetName,
        budgetAmount: budgetData.budgetAmount,
        budgetPeriod: budgetData.budgetPeriod,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        alertThreshold: budgetData.alertThreshold,
        categoryId: budgetData.categoryId,
        isActive: true // Luôn đặt là active khi tạo/cập nhật
    };
};

// Tạo một instance của axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor để tự động gắn token vào mỗi request
apiClient.interceptors.request.use(
    config => {
        try {
            const token = getAuthToken();
            config.headers['Authorization'] = `Bearer ${token}`;
        } catch (error) {
            // Nếu không có token, hủy request
            return Promise.reject(error);
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
        // Lọc các budget active và chuẩn hóa dữ liệu
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
    if (!budgetId) throw new Error('Budget ID is required for update');
    try {
        const apiPayload = normalizeBudgetForApi(budgetData);
        // API của bạn có thể trả về NoContent (204) hoặc budget đã cập nhật
        await apiClient.put(`/${budgetId}`, apiPayload);
        // Giả định trả về thành công, ta có thể trả về object đã chuẩn hóa
        return normalizeBudgetFromApi({ budgetId, ...apiPayload, spentAmount: budgetData.spentAmount || 0 });
    } catch (error) {
        console.error(`API Error - updateBudget(${budgetId}):`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteBudget = async (budgetId) => {
    if (!budgetId) throw new Error('Budget ID is required for deletion');
    try {
        await apiClient.delete(`/${budgetId}`);
    } catch (error) {
        console.error(`API Error - deleteBudget(${budgetId}):`, error.response?.data || error.message);
        throw error;
    }
};

// Đừng quên hàm getBudgetAlerts nếu bạn vẫn muốn dùng
export const getBudgetAlerts = async () => {
    try {
        const response = await apiClient.get('/alerts');
        return response.data;
    } catch (error) {
        console.error("API Error - getBudgetAlerts:", error.response?.data || error.message);
        throw error;
    }
};