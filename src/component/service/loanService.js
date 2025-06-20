// src/service/loanService.js
import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/Loans';
const getAuthToken = () => localStorage.getItem('authToken');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
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

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.error("Authentication Error. Logging out...");
            localStorage.removeItem('authToken');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const getAllLoans = async () => {
  try {
    const response = await apiClient.get('/');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching loans:', error.response?.data || error.message);
    throw error;
  }
};

export const createLoan = async (loanData) => {
  try {
    const response = await apiClient.post('/', loanData);
    return response.data;
  } catch (error) {
    console.error('Error creating loan:', error.response?.data || error.message);
    throw error;
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    await apiClient.put(`/${id}`, loanData);
  } catch (error)
  {
    console.error(`Error updating loan ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    await apiClient.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting loan ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// MỚI: HÀM CÒN THIẾU GÂY RA LỖI ĐÃ ĐƯỢC THÊM VÀO
/**
 * Creates a payment for a specific loan.
 * @param {number} loanId The ID of the loan to pay.
 * @param {object} paymentData The payment details.
 * @returns {Promise<object>} The server response after payment.
 */
export const createLoanPayment = async (loanId, paymentData) => {
  try {
    const response = await apiClient.post(`/${loanId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error(`Error creating payment for loan ${loanId}:`, error.response?.data || error.message);
    throw error;
  }
};