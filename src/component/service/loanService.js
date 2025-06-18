import axios from 'axios';

// URL cơ sở cho API khoản vay
const API_BASE_URL = 'https://localhost:7166/api/Loans';

// Lấy token từ localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor để thêm token vào header Authorization
apiClient.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = 'Bearer ${token}';
    }
    return config;
  },
  error => Promise.reject(error)
);

// Hàm GET danh sách khoản vay
export const getAllLoans = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khoản vay:', error);
    throw error;
  }
};
export const createLoan = async (loanData) => {
    const response = await apiClient.post('/', loanData);
    return response.data;
  };