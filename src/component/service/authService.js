// src/services/authService.js
const API_BASE_URL = 'https://localhost:7166/api/Auth';

// Hàm xử lý response chung (có thể tái sử dụng)
const handleApiResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    let responseData;

    // Cố gắng đọc response dựa trên content type
    if (contentType && contentType.indexOf("application/json") !== -1) {
        try {
            responseData = await response.json();
        } catch (jsonError) {
            // Nếu server nói là JSON nhưng gửi text lỗi hoặc JSON không hợp lệ
            console.error("Failed to parse JSON response:", jsonError);
            const textResponse = await response.text(); // Đọc như text để không mất thông tin
            // Ném lỗi với thông tin từ textResponse nếu có, hoặc lỗi parse JSON
            throw new Error(textResponse || `Failed to parse JSON response. Status: ${response.status}. Error: ${jsonError.message}`);
        }
    } else {
        // Nếu không phải JSON, đọc như text
        responseData = await response.text();
    }

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (typeof responseData === 'object' && responseData !== null) {
            // Ưu tiên lấy message từ các trường phổ biến, hoặc stringify toàn bộ object
            errorMessage = responseData?.message || responseData?.title || responseData?.error || JSON.stringify(responseData);
        } else if (typeof responseData === 'string' && responseData.trim() !== '') {
            errorMessage = responseData;
        }
        throw new Error(errorMessage);
    }

    // Nếu response.ok và là text (ví dụ server trả về "Success" cho 200 OK)
    // Gói nó vào một object để component dễ xử lý hơn
    if (typeof responseData === 'string') {
        return { message: responseData };
    }

    return responseData; // Trả về dữ liệu JSON nếu thành công
};


export const registerUser = async (userData) => {
    try {
        console.log("Registering user with data:", userData); // Log dữ liệu gửi đi
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Thêm Accept header để rõ ràng hơn
            },
            body: JSON.stringify(userData),
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error("Registration service error:", error.message);
        // Ném lại lỗi đã được xử lý (hoặc lỗi gốc nếu là lỗi mạng)
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        console.log("Logging in user with credentials:", credentials); // Log dữ liệu gửi đi
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials),
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error("Login service error:", error.message);
        throw error;
    }
};