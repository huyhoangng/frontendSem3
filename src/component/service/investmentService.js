// src/service/investmentService.js
import axios from 'axios';

// Cấu hình base URL cho API investments
const API_URL = 'https://localhost:7166/api/Investments';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Lấy danh sách tất cả các khoản đầu tư
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getInvestments = () => {
    return apiClient.get('');
};

/**
 * Lấy dữ liệu tổng hợp về các khoản đầu tư
 * @returns {Promise<{
 *   totalInvested: number,
 *   totalCurrentValue: number,
 *   totalGainLoss: number,
 *   totalGainLossPercentage: number,
 *   totalInvestments: number,
 *   investmentsByType: Array<{
 *     investmentType: string,
 *     count: number,
 *     totalInvested: number,
 *     totalCurrentValue: number,
 *     gainLoss: number,
 *     gainLossPercentage: number
 *   }>,
 *   topPerformers: Array<{
 *     investmentId: number,
 *     investmentName: string,
 *     symbol: string,
 *     totalInvested: number,
 *     currentValue: number,
 *     gainLoss: number,
 *     gainLossPercentage: number
 *   }>,
 *   worstPerformers: Array<{
 *     investmentId: number,
 *     investmentName: string,
 *     symbol: string,
 *     totalInvested: number,
 *     currentValue: number,
 *     gainLoss: number,
 *     gainLossPercentage: number
 *   }>
 * }>}
 */
export const getInvestmentSummary = () => {
    return apiClient.get('/summary')
        .then(response => {
            console.log('Summary response:', response.data);
            
            // Validate and format the response data
            const summary = response.data;
            
            // Ensure all numeric values are properly formatted
            const formattedSummary = {
                ...summary,
                totalInvested: Number(summary.totalInvested) || 0,
                totalCurrentValue: Number(summary.totalCurrentValue) || 0,
                totalGainLoss: Number(summary.totalGainLoss) || 0,
                totalGainLossPercentage: Number(summary.totalGainLossPercentage) || 0,
                totalInvestments: Number(summary.totalInvestments) || 0,
                investmentsByType: (summary.investmentsByType || []).map(type => ({
                    ...type,
                    count: Number(type.count) || 0,
                    totalInvested: Number(type.totalInvested) || 0,
                    totalCurrentValue: Number(type.totalCurrentValue) || 0,
                    gainLoss: Number(type.gainLoss) || 0,
                    gainLossPercentage: Number(type.gainLossPercentage) || 0
                })),
                topPerformers: (summary.topPerformers || []).map(investment => ({
                    ...investment,
                    investmentId: Number(investment.investmentId) || 0,
                    totalInvested: Number(investment.totalInvested) || 0,
                    currentValue: Number(investment.currentValue) || 0,
                    gainLoss: Number(investment.gainLoss) || 0,
                    gainLossPercentage: Number(investment.gainLossPercentage) || 0
                })),
                worstPerformers: (summary.worstPerformers || []).map(investment => ({
                    ...investment,
                    investmentId: Number(investment.investmentId) || 0,
                    totalInvested: Number(investment.totalInvested) || 0,
                    currentValue: Number(investment.currentValue) || 0,
                    gainLoss: Number(investment.gainLoss) || 0,
                    gainLossPercentage: Number(investment.gainLossPercentage) || 0
                }))
            };

            return formattedSummary;
        })
        .catch(error => {
            console.error('Error fetching investment summary:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch investment summary');
        });
};

/**
 * Thêm một khoản đầu tư mới
 * @param {object} investmentData - Dữ liệu của khoản đầu tư cần thêm
 * @returns {Promise<AxiosResponse<any>>}
 */
export const addInvestment = (investmentData) => {
    // Validate required fields
    const requiredFields = ['investmentName', 'investmentType', 'purchasePrice', 'totalInvested', 'currentValue', 'purchaseDate'];
    const missingFields = requiredFields.filter(field => !investmentData[field]);
    
    if (missingFields.length > 0) {
        return Promise.reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Format the data according to API structure
    const formattedData = {
        ...investmentData,
        quantity: Number(investmentData.quantity) || 0,
        purchasePrice: Number(investmentData.purchasePrice),
        currentPrice: Number(investmentData.currentPrice) || 0,
        totalInvested: Number(investmentData.totalInvested),
        currentValue: Number(investmentData.currentValue),
        accountId: Number(investmentData.accountId) || 0,
        purchaseDate: new Date(investmentData.purchaseDate).toISOString()
    };

    return apiClient.post('', formattedData);
};

/**
 * Cập nhật một khoản đầu tư đã có
 * @param {number} id - ID của khoản đầu tư cần cập nhật
 * @param {object} investmentData - Dữ liệu mới của khoản đầu tư
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateInvestment = (id, investmentData) => {
    if (!id) {
        return Promise.reject(new Error('Investment ID is required for update'));
    }

    // Format the data according to API structure
    const formattedData = {
        ...investmentData,
        quantity: Number(investmentData.quantity) || 0,
        purchasePrice: Number(investmentData.purchasePrice),
        currentPrice: Number(investmentData.currentPrice) || 0,
        totalInvested: Number(investmentData.totalInvested),
        currentValue: Number(investmentData.currentValue),
        accountId: Number(investmentData.accountId) || 0,
        purchaseDate: new Date(investmentData.purchaseDate).toISOString()
    };

    return apiClient.put(`/${id}`, formattedData);
};

/**
 * Xóa một khoản đầu tư theo ID
 * @param {number} id - ID của khoản đầu tư
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deleteInvestmentById = (id) => {
    if (!id && id !== 0) {
        return Promise.reject(new Error('Investment ID is required for deletion'));
    }

    // Validate that id is a number
    const numericId = Number(id);
    if (isNaN(numericId)) {
        return Promise.reject(new Error('Invalid investment ID format'));
    }

    // Log the request details
    console.log('Sending delete request for investment ID:', numericId);

    return apiClient.delete(`/${numericId}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
            return status >= 200 && status < 500; // Accept all status codes less than 500
        }
    })
    .then(response => {
        console.log('Delete response:', response);
        
        // Check if the response indicates success
        if (response.status === 200 || response.status === 204) {
            return response;
        }
        
        // If we get here, the server returned an error status
        const errorMessage = response.data?.message || 'Failed to delete investment';
        throw new Error(errorMessage);
    })
    .catch(error => {
        console.error('Delete error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        // Provide more specific error messages based on the response
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    throw new Error('Investment not found');
                case 403:
                    throw new Error('You do not have permission to delete this investment');
                case 400:
                    throw new Error(error.response.data?.message || 'Invalid request');
                case 500:
                    throw new Error('Server error occurred while deleting investment. Please try again later.');
                default:
                    throw new Error(error.response.data?.message || 'Failed to delete investment');
            }
        }
        
        // If no response from server
        if (error.request) {
            throw new Error('No response from server. Please check your connection.');
        }
        
        // If error in request setup
        throw new Error('Error setting up delete request: ' + error.message);
    });
};

/**
 * Lấy thông tin chi tiết của một khoản đầu tư theo ID
 * @param {number} id - ID của khoản đầu tư
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getInvestmentById = (id) => {
    return apiClient.get(`/${id}`);
};

/**
 * Cập nhật thông tin một khoản đầu tư theo ID
 * @param {number} id - ID của khoản đầu tư
 * @param {object} investmentData - Dữ liệu cập nhật của khoản đầu tư
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateInvestmentById = (id, investmentData) => {
    // Validate required fields
    const requiredFields = ['investmentName', 'investmentType', 'purchasePrice', 'totalInvested', 'currentValue', 'purchaseDate'];
    const missingFields = requiredFields.filter(field => !investmentData[field]);
    
    if (missingFields.length > 0) {
        return Promise.reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
    }

    return apiClient.put(`/${id}`, investmentData);
};