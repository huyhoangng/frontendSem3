// src/service/loanService.js
import axios from 'axios';

// Dùng chung base URL để linh hoạt
const API_BASE_URL = 'https://localhost:7166/api';
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

// --- Loan APIs ---
export const getAllLoans = async () => {
  try {
    const response = await apiClient.get('/Loans');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching loans:', error.response?.data || error.message);
    throw error;
  }
};

export const createLoan = async (loanData) => {
  try {
    const response = await apiClient.post('/Loans', loanData);
    return response.data;
  } catch (error) {
    console.error('Error creating loan:', error.response?.data || error.message);
    throw error;
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    await apiClient.put(`/Loans/${id}`, loanData);
  } catch (error) {
    console.error(`Error updating loan ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    await apiClient.delete(`/Loans/${id}`);
  } catch (error) {
    console.error(`Error deleting loan ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const createLoanPayment = async (loanId, paymentData) => {
  try {
    const response = await apiClient.post(`/Loans/${loanId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error(`Error creating payment for loan ${loanId}:`, error.response?.data || error.message);
    throw error;
  }
};

// --- MỚI: Account API (Lấy danh sách tài khoản) ---
/**
 * Lấy danh sách tài khoản của người dùng
 * @returns {Promise<Array>}
 */
export const getAccounts = async () => {
    try {
        const response = await apiClient.get('/Accounts');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching accounts:', error.response?.data || error.message);
        throw error;
    }
};