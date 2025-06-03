// src/services/categoryService.js
const API_BASE_URL = 'http://13.229.83.186:5000/api/Categories';

const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Hàm này sẽ chuẩn hóa dữ liệu từ API sang dạng state của React component
const normalizeCategoryFromApi = (apiCategory) => {
    return {
        id: apiCategory.id, // Giả sử API trả về ID
        name: apiCategory.name,
        type: apiCategory.categoryType?.toLowerCase(), // Chuyển "Expense" -> "expense"
        description: apiCategory.description,
        color: apiCategory.color,
        icon: apiCategory.icon, // Giữ nguyên, sẽ thêm "bi-" khi hiển thị nếu cần
        isDefault: apiCategory.isDefault,
    };
};

// Hàm này sẽ chuẩn hóa dữ liệu từ state của React component sang dạng API yêu cầu
const normalizeCategoryForApi = (appCategory) => {
    return {
        id: appCategory.id, // Giữ lại id nếu có (cho update)
        name: appCategory.name,
        categoryType: appCategory.type?.charAt(0).toUpperCase() + appCategory.type?.slice(1), // "expense" -> "Expense"
        description: appCategory.description,
        color: appCategory.color,
        icon: appCategory.icon,
        isDefault: appCategory.isDefault || false, // Đảm bảo có giá trị boolean
    };
};


const handleApiResponse = async (response) => {
    // ... (Giữ nguyên hàm handleApiResponse như phiên bản trước)
    const contentType = response.headers.get("content-type");
    let responseData;

    if (contentType && contentType.indexOf("application/json") !== -1) {
        try {
            responseData = await response.json();
        } catch (jsonError) {
            console.error("Failed to parse JSON response:", jsonError);
            const textResponse = await response.text();
            throw new Error(textResponse || `Failed to parse JSON response. Status: ${response.status}. Error: ${jsonError.message}`);
        }
    } else {
        responseData = await response.text();
    }

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (response.status === 401) {
            errorMessage = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
        } else if (typeof responseData === 'object' && responseData !== null) {
            errorMessage = responseData?.message || responseData?.title || responseData?.error || JSON.stringify(responseData);
        } else if (typeof responseData === 'string' && responseData.trim() !== '') {
            errorMessage = responseData;
        }
        throw new Error(errorMessage);
    }

    if (typeof responseData === 'string' && response.status !== 204) {
        return { message: responseData };
    }
    if (response.status === 204) {
        return null;
    }
    return responseData;
};

const createAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const getCategories = async () => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: createAuthHeaders(),
        });
        const apiResponse = await handleApiResponse(response);
        // API trả về { categories: [...] }, chúng ta cần lấy mảng categories
        // Hoặc nếu API trả về trực tiếp mảng: const categoriesArray = apiResponse;
        const categoriesArray = apiResponse.categories || apiResponse; // Linh hoạt nếu API thay đổi
        if (Array.isArray(categoriesArray)) {
            return categoriesArray.map(normalizeCategoryFromApi);
        }
        return []; // Trả về mảng rỗng nếu không phải array
    } catch (error) {
        console.error("Get categories service error:", error.message);
        throw error;
    }
};

export const createCategory = async (categoryData) => {
    try {
        const apiPayload = normalizeCategoryForApi(categoryData);
        // Nếu API tự tạo ID, loại bỏ trường ID khỏi payload khi tạo mới
        const { id, ...payloadWithoutId } = apiPayload;

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(payloadWithoutId), // Gửi payload đã chuẩn hóa và bỏ ID
        });
        const createdApiCategory = await handleApiResponse(response);
        return createdApiCategory ? normalizeCategoryFromApi(createdApiCategory) : null; // Chuẩn hóa lại nếu API trả về đối tượng đã tạo
    } catch (error) {
        console.error("Create category service error:", error.message);
        throw error;
    }
};

export const updateCategory = async (id, categoryData) => {
    try {
        const apiPayload = normalizeCategoryForApi({ ...categoryData, id }); // Đảm bảo id được bao gồm
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: createAuthHeaders(),
            body: JSON.stringify(apiPayload),
        });
        // PUT có thể không trả về body hoặc trả về đối tượng đã update
        const updatedApiCategory = await handleApiResponse(response);
        return updatedApiCategory ? normalizeCategoryFromApi(updatedApiCategory) : null;
    } catch (error) {
        console.error("Update category service error:", error.message);
        throw error;
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: createAuthHeaders(),
        });
        return await handleApiResponse(response); // Thường trả về 204 No Content
    } catch (error) {
        console.error("Delete category service error:", error.message);
        throw error;
    }
};