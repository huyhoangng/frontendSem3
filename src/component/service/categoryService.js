import axios from 'axios';

const API_BASE_URL = 'https://localhost:7166/api/Categories';

const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No valid authentication token found. Please log in.');
  }
  return token;
};

const normalizeCategoryFromApi = (apiCategory) => {
  console.log('Normalizing category from API:', apiCategory);
  const normalized = {
    id: apiCategory.categoryId,
    name: apiCategory.name,
    type: apiCategory.categoryType?.toUpperCase(),
    description: apiCategory.description,
    color: apiCategory.color,
    icon: apiCategory.icon,
    isDefault: apiCategory.isDefault,
    isActive: apiCategory.isActive,
    createdAt: apiCategory.createdAt,
    updatedAt: apiCategory.updatedAt
  };
  console.log('Normalized category:', normalized);
  return normalized;
};

const normalizeCategoryForApi = (appCategory) => {
  console.log('Normalizing category for API:', appCategory);
  const normalized = {
    name: appCategory.name,
    categoryType: appCategory.type?.toUpperCase(),
    description: appCategory.description,
    color: appCategory.color,
    icon: appCategory.icon,
    isDefault: appCategory.isDefault || false,
    isActive: true
  };
  console.log('Normalized category for API:', normalized);
  return normalized;
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

export const getCategories = async () => {
  try {
    console.log('Fetching categories...');
    const response = await apiClient.get('/');
    console.log('Raw API response:', response.data);
    
    const categoriesData = Array.isArray(response.data) ? response.data : response.data.categories || [];
    console.log('Categories data before filtering:', categoriesData);
    
    const activeCategories = categoriesData.filter(cat => cat.isActive);
    console.log('Active categories:', activeCategories);
    
    const normalizedCategories = activeCategories.map(normalizeCategoryFromApi);
    console.log('Final normalized categories:', normalizedCategories);
    
    return normalizedCategories;
  } catch (error) {
    console.error("API Error - getCategories:", error.response?.data || error.message);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    console.log('Creating category with data:', categoryData);
    const apiPayload = {
      name: categoryData.name,
      categoryType: categoryData.type?.toUpperCase(),
      description: categoryData.description || '',
      color: categoryData.color,
      icon: categoryData.icon,
      isDefault: categoryData.isDefault || false,
      isActive: true
    };
    console.log('Category API payload:', apiPayload);
    
    const response = await apiClient.post('/', apiPayload);
    console.log('Create category response:', response.data);
    
    return normalizeCategoryFromApi(response.data);
  } catch (error) {
    console.error("API Error - createCategory:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const apiPayload = {
      name: categoryData.name,
      categoryType: categoryData.type,
      description: categoryData.description || '',
      color: categoryData.color,
      icon: categoryData.icon,
      isDefault: categoryData.isDefault || false,
      isActive: categoryData.isActive
    };
    const response = await apiClient.put(`/${id}`, apiPayload);
    return normalizeCategoryFromApi(response.data);
  } catch (error) {
    console.error(`API Error - updateCategory(${id}):`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    await apiClient.delete(`/${id}`);
  } catch (error) {
    console.error(`API Error - deleteCategory(${id}):`, error.response?.data || error.message);
    throw error;
  }
};