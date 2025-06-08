// src/services/budgetService.js
import axios from 'axios';

// --- Cấu hình cơ bản ---
const API_BASE_URL = 'https://localhost:7166/api'; // Sử dụng HTTPS

// --- Hàm trợ giúp lấy Token và tạo Axios Instance ---
const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn("Auth token not found in localStorage.");
        throw new Error("Authentication token is missing. Please log in.");
    }
    return token;
};

const createApiClient = (resourcePath) => {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        
        const userId = localStorage.getItem('userId');
        if (userId) {
            headers['X-User-ID'] = userId;
        }

        return axios.create({
            baseURL: `${API_BASE_URL}/${resourcePath}`,
            headers,
        });
    } catch (error) {
        console.error("Could not create authenticated API client:", error.message);
        return axios.create({
            baseURL: `${API_BASE_URL}/${resourcePath}`,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
    }
};

const budgetApiClient = createApiClient('budgets');
const categoryApiClient = createApiClient('categories');


// --- Các hàm chuẩn hóa dữ liệu (private cho module này) ---
const normalizeBudgetFromApi = (apiBudget) => {
    const startDate = apiBudget.startDate && !isNaN(new Date(apiBudget.startDate).getTime())
        ? new Date(apiBudget.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const endDate = apiBudget.endDate && !isNaN(new Date(apiBudget.endDate).getTime())
        ? new Date(apiBudget.endDate).toISOString().slice(0, 10)
        : startDate;

    // --- THAY ĐỔI / THÊM MỚI ---
    // Thêm 'Quarterly' vào danh sách các chu kỳ hợp lệ
    const validPeriods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    
    return {
        id: apiBudget.id,
        budgetName: apiBudget.budgetName || '',
        budgetAmount: Math.abs(apiBudget.budgetAmount) || 0,
        budgetPeriod: validPeriods.includes(apiBudget.budgetPeriod) 
            ? apiBudget.budgetPeriod 
            : 'Monthly', // Mặc định nếu API trả về giá trị không hợp lệ
        startDate,
        endDate,
        alertThreshold: Math.abs(apiBudget.alertThreshold) || 0,
        categoryId: apiBudget.categoryId || '',
    };
};

const normalizeCategoryFromApi = (apiCategory) => {
    return {
        id: apiCategory.id,
        name: apiCategory.name || '',
        type: apiCategory.categoryType?.toLowerCase() || '',
        description: apiCategory.description || '',
        color: apiCategory.color || '#6c757d',
        icon: apiCategory.icon || '',
        isDefault: apiCategory.isDefault || false,
    };
};


// --- Các hàm gọi API được EXPORT ra ngoài ---

export const getBudgets = async () => {
    const response = await budgetApiClient.get('/');
    const budgetsData = Array.isArray(response.data) ? response.data : response.data.budgets || [];
    if (!Array.isArray(budgetsData)) {
        throw new Error('Budgets data from API is not an array.');
    }
    return budgetsData.map(normalizeBudgetFromApi);
};

export const getCategories = async () => {
    const response = await categoryApiClient.get('/');
    const categoriesData = Array.isArray(response.data) ? response.data : response.data.categories || [];
    if (!Array.isArray(categoriesData)) {
        throw new Error('Categories data from API is not an array.');
    }
    return categoriesData.map(normalizeCategoryFromApi);
};

export const createBudget = async (payload) => {
    const response = await budgetApiClient.post('/', payload);
    return normalizeBudgetFromApi(response.data);
};

export const updateBudget = async (id, payload) => {
    const response = await budgetApiClient.put(`/${id}`, payload);
    return response.data ? normalizeBudgetFromApi(response.data) : null;
};

export const deleteBudget = async (id) => {
    await budgetApiClient.delete(`/${id}`);
};