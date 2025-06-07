import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/Categories';

const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token || token === 'YOUR_TOKEN_HERE') {
    throw new Error('No valid authentication token found. Please log in.');
  }
  return token;
};

const normalizeCategoryFromApi = (apiCategory) => {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    type: apiCategory.categoryType?.toLowerCase(),
    description: apiCategory.description,
    color: apiCategory.color,
    icon: apiCategory.icon,
    isDefault: apiCategory.isDefault,
  };
};

const normalizeCategoryForApi = (appCategory) => {
  return {
    name: appCategory.name,
    categoryType: appCategory.type?.charAt(0).toUpperCase() + appCategory.type?.slice(1),
    description: appCategory.description,
    color: appCategory.color,
    icon: appCategory.icon,
    isDefault: appCategory.isDefault || false,
  };
};

const createAxiosInstance = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const getCategories = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    console.log('Fetching categories with headers:', axiosInstance.defaults.headers);
    const response = await axiosInstance.get('');
    const categoriesArray = response.data.categories || response.data;
    if (Array.isArray(categoriesArray)) {
      return categoriesArray.map(normalizeCategoryFromApi);
    }
    return [];
  } catch (error) {
    console.error('Get categories error:', error.response?.data, error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

export const createCategory = async (categoryData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const apiPayload = normalizeCategoryForApi(categoryData);
    const response = await axiosInstance.post('', apiPayload);
    return normalizeCategoryFromApi(response.data);
  } catch (error) {
    console.error('Create category error:', error.response?.data, error.message);
    throw new Error(error.response?.data?.message || 'Failed to create category');
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const apiPayload = normalizeCategoryForApi({ ...categoryData, id });
    const response = await axiosInstance.put(`/${id}`, apiPayload);
    return response.data ? normalizeCategoryFromApi(response.data) : null;
  } catch (error) {
    console.error('Update category error:', error.response?.data, error.message);
    throw new Error(error.response?.data?.message || 'Failed to update category');
  }
};

export const deleteCategory = async (id) => {
  try {
    const axiosInstance = createAxiosInstance();
    await axiosInstance.delete(`/${id}`);
    return null;
  } catch (error) {
    console.error('Delete category error:', error.response?.data, error.message);
    throw new Error(error.response?.data?.message || 'Failed to delete category');
  }
};