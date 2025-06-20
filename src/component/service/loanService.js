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

// Interceptor để gắn token vào mỗi request
apiClient.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      // SỬA LỖI QUAN TRỌNG: Dùng dấu backtick (`) để nội suy biến token
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// MỚI: Interceptor để xử lý lỗi 401 tự động
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.error("Lỗi xác thực: Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...");
            localStorage.removeItem('authToken');
            // Chuyển hướng về trang đăng nhập
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
    console.error('Lỗi khi lấy danh sách khoản vay:', error.response?.data || error.message);
    throw error;
  }
};

export const createLoan = async (loanData) => {
  try {
    const response = await apiClient.post('/', loanData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo khoản vay:', error.response?.data || error.message);
    throw error;
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    await apiClient.put(`/${id}`, loanData);
  } catch (error) {
    console.error(`Lỗi khi cập nhật khoản vay ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    await apiClient.delete(`/${id}`);
  } catch (error) {
    console.error(`Lỗi khi xóa khoản vay ${id}:`, error.response?.data || error.message);
    throw error;
  }
};