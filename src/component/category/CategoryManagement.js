// src/component/category/CategoryManagement.js (Hoặc đường dẫn đúng của bạn)

import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../service/categoryService'; // <<--- **QUAN TRỌNG: KIỂM TRA ĐƯỜNG DẪN NÀY!**

// --- Định nghĩa các hằng số màu ở phạm vi có thể truy cập bởi cả hai component ---
const DEFAULT_EXPENSE_COLOR = '#FF5733'; // Màu từ ví dụ API của bạn cho Expense
const DEFAULT_INCOME_COLOR = '#00FF00'; // Màu từ ví dụ API của bạn cho Income

// --- Danh sách icon gợi ý (Bootstrap Icons) ---
// Giá trị 'value' ở đây nên là tên icon mà API của bạn lưu trữ (ví dụ: "utensils")
// Giá trị 'bsClass' là class đầy đủ của Bootstrap Icon để hiển thị (ví dụ: "bi-utensils")
// Nếu API lưu trữ class đầy đủ (ví dụ "bi-utensils"), thì 'value' và 'bsClass' có thể giống nhau.
const suggestedIcons = [
    { value: 'tag-fill', label: 'Tag (Mặc định)', bsClass: 'bi-tag-fill' },
    { value: 'house-door-fill', label: 'Nhà cửa', bsClass: 'bi-house-door-fill' },
    { value: 'cart-fill', label: 'Mua sắm', bsClass: 'bi-cart-fill' },
    { value: 'cup-straw', label: 'Ăn uống', bsClass: 'bi-cup-straw' },
    { value: 'car-front-fill', label: 'Di chuyển', bsClass: 'bi-car-front-fill' },
    { value: 'heart-pulse-fill', label: 'Sức khỏe', bsClass: 'bi-heart-pulse-fill' },
    { value: 'book-fill', label: 'Giáo dục', bsClass: 'bi-book-fill' },
    { value: 'gift-fill', label: 'Quà tặng', bsClass: 'bi-gift-fill' },
    { value: 'cash-stack', label: 'Lương/Thu nhập', bsClass: 'bi-cash-stack' },
    { value: 'graph-up-arrow', label: 'Đầu tư', bsClass: 'bi-graph-up-arrow' },
    { value: 'receipt', label: 'Hóa đơn', bsClass: 'bi-receipt' },
    { value: 'phone-fill', label: 'Điện thoại', bsClass: 'bi-phone-fill' },
    { value: 'film', label: 'Giải trí', bsClass: 'bi-film' },
    { value: 'airplane-fill', label: 'Du lịch', bsClass: 'bi-airplane-fill' },
    { value: 'tools', label: 'Sửa chữa', bsClass: 'bi-tools' },
    { value: 'bank', label: 'Ngân hàng', bsClass: 'bi-bank' },
    { value: 'credit-card-2-front-fill', label: 'Thẻ tín dụng', bsClass: 'bi-credit-card-2-front-fill' },
    { value: 'question-circle-fill', label: 'Khác', bsClass: 'bi-question-circle-fill' },
    // Ví dụ ánh xạ từ tên API (nếu khác)
    { value: 'utensils', label: 'Ăn uống (dao nĩa)', bsClass: 'bi-egg-fried' }, // Giả sử API lưu 'utensils', bạn muốn hiển thị 'bi-egg-fried'
    { value: 'money-bill', label: 'Tiền mặt', bsClass: 'bi-piggy-bank-fill' },
];

// --- Danh sách màu cơ bản gợi ý ---
const basicColors = [
    '#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd',
    '#6f42c1', '#d63384', '#6c757d', '#adb5bd', '#343a40',
    '#20c997', '#0dcaf0'
];


// --- Định nghĩa CategoryFormModal (Component nội bộ) ---
const CategoryFormModal = ({ onClose, onSubmit, categoryToEdit }) => {
    // Sử dụng hằng số màu đã định nghĩa ở phạm vi ngoài
    const initialFormState = {
        name: '',
        type: 'expense', // State nội bộ vẫn dùng "expense"/"income"
        icon: suggestedIcons[0].value, // Giá trị icon (không có "bi-")
        color: DEFAULT_EXPENSE_COLOR,
        description: '',
        isDefault: false,
    };
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');

    useEffect(() => {
        if (categoryToEdit) {
            setFormData({
                name: categoryToEdit.name || '',
                type: categoryToEdit.type || 'expense', // state vẫn là 'expense'/'income'
                icon: categoryToEdit.icon || suggestedIcons[0].value,
                color: categoryToEdit.color || (categoryToEdit.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR),
                description: categoryToEdit.description || '',
                isDefault: categoryToEdit.isDefault || false,
            });
        } else {
            const defaultColorBasedOnType = initialFormState.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR;
            setFormData({...initialFormState, color: defaultColorBasedOnType, icon: suggestedIcons[0].value});
        }
        setError('');
    }, [categoryToEdit]);

    useEffect(() => {
        if (!categoryToEdit) {
            if (formData.type === 'income') {
                setFormData(prev => ({ ...prev, color: DEFAULT_INCOME_COLOR }));
            } else {
                setFormData(prev => ({ ...prev, color: DEFAULT_EXPENSE_COLOR }));
            }
        }
    }, [formData.type, categoryToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleColorButtonClick = (color) => {
        setFormData(prev => ({ ...prev, color: color }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim()) {
            setError('Tên danh mục không được để trống.');
            return;
        }
        try {
            await onSubmit(formData); // formData này sẽ được service chuẩn hóa trước khi gửi
            onClose();
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi lưu danh mục.');
        }
    };
    
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    };
    const modalContentStyle = {
        backgroundColor: 'white', padding: '25px', borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1050,
        width: '90%', maxWidth: '550px',
        maxHeight: '90vh', overflowY: 'auto'
    };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalContentStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">{categoryToEdit ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>

                {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
                <form onSubmit={handleSubmit}>
                     <div className="mb-3">
                        <label htmlFor="modal-category-name" className="form-label fw-bold">Tên danh mục:</label>
                        <input
                            className="form-control" type="text" id="modal-category-name" name="name"
                            value={formData.name} onChange={handleChange} required placeholder="Ví dụ: Ăn uống, Lương"
                        />
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="modal-category-type" className="form-label fw-bold">Loại:</label>
                            <select
                                className="form-select" id="modal-category-type" name="type"
                                value={formData.type} onChange={handleChange}
                            >
                                <option value="expense">Chi tiêu (Expense)</option>
                                <option value="income">Thu nhập (Income)</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="modal-category-icon" className="form-label fw-bold">Icon:</label>
                            <select
                                className="form-select" id="modal-category-icon" name="icon"
                                value={formData.icon} onChange={handleChange}
                            >
                                {suggestedIcons.map(iconItem => (
                                    <option key={iconItem.value} value={iconItem.value}>
                                        {iconItem.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold d-block">Màu sắc:</label>
                        <div className="d-flex align-items-center flex-wrap">
                            <input
                                type="color"
                                className="form-control form-control-color me-2 mb-2"
                                id="modal-category-color-picker"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                title="Chọn màu tùy chỉnh"
                                style={{ width: '50px', height: '40px', flexShrink: 0 }}
                            />
                            {basicColors.map(colorHex => (
                                <button
                                    type="button"
                                    key={colorHex}
                                    className="btn btn-sm me-1 mb-1 p-0"
                                    style={{
                                        backgroundColor: colorHex,
                                        width: '30px',
                                        height: '30px',
                                        border: formData.color === colorHex ? '3px solid #0d6efd' : '1px solid #ddd',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        boxShadow: formData.color === colorHex ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none'
                                    }}
                                    onClick={() => handleColorButtonClick(colorHex)}
                                    title={`Chọn màu ${colorHex}`}
                                >
                                     
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="modal-category-description" className="form-label fw-bold">Chú thích (Tùy chọn):</label>
                        <textarea
                            className="form-control"
                            id="modal-category-description"
                            name="description"
                            rows="2"
                            placeholder="Ghi chú thêm về danh mục này..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            name="isDefault"
                            id="modal-category-isDefault"
                            checked={formData.isDefault}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="modal-category-isDefault">
                            Đặt làm danh mục mặc định?
                        </label>
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn btn-primary">{categoryToEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- Kết thúc định nghĩa CategoryFormModal ---


// --- Định nghĩa CategoryManagement (Component chính của trang) ---
function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setPageError(null);
        try {
            const data = await api.getCategories();
            setCategories(data || []);
        } catch (err) {
            setPageError(err.message || 'Không thể tải danh mục.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenAddModal = () => {
        setCategoryToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (category) => {
        setCategoryToEdit(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCategoryToEdit(null);
    };

    const handleSubmitCategory = async (formDataFromModal) => {
        setIsLoading(true);
        setPageError(null);
        try {
            if (categoryToEdit && categoryToEdit.id) {
                await api.updateCategory(categoryToEdit.id, formDataFromModal);
            } else {
                await api.createCategory(formDataFromModal);
            }
            await fetchCategories();
            handleCloseModal(); // Đóng modal sau khi submit thành công
        } catch (err) {
            console.error("Error submitting category from Page:", err);
            // Lỗi đã được hiển thị trong modal thông qua state `error` của CategoryFormModal
            // Nếu muốn hiển thị thêm lỗi ở trang chính:
            setPageError("Lưu danh mục thất bại: " + (err.message || "Lỗi không xác định"));
            // Không đóng modal nếu có lỗi ở đây để người dùng còn thấy lỗi trong form
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            setIsLoading(true);
            setPageError(null);
            try {
                await api.deleteCategory(id);
                await fetchCategories();
            } catch (err) {
                setPageError(err.message || 'Lỗi khi xóa danh mục.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Hàm tìm bsClass của icon từ value (tên icon từ API/state)
    const getIconBsClass = (iconValue) => {
        const foundIcon = suggestedIcons.find(i => i.value === iconValue);
        return foundIcon ? foundIcon.bsClass : `bi-${iconValue}`; // Fallback nếu không tìm thấy trong suggestedIcons
    };
    // Hàm tìm label của icon từ value
     const getIconLabel = (iconValue) => {
        const foundIcon = suggestedIcons.find(i => i.value === iconValue);
        return foundIcon ? foundIcon.label : iconValue;
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Quản Lý Danh Mục</h1>
                <button onClick={handleOpenAddModal} className="btn btn-primary">
                    <i className="bi bi-plus-circle-fill me-2"></i>Thêm Danh Mục Mới
                </button>
            </div>

            {isLoading && <div className="alert alert-info text-center">Đang xử lý...</div>}
            {pageError && <div className="alert alert-danger text-center">Lỗi: {pageError}</div>}

            {!isLoading && !pageError && categories.length === 0 && (
                 <div className="text-center p-5 border rounded bg-light shadow-sm">
                    <i className="bi bi-tags-fill" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    <h4 className="mt-3 mb-2">Chưa có danh mục nào</h4>
                    <p className="text-muted">Hãy tạo danh mục để bắt đầu phân loại thu chi của bạn.</p>
                    <button className="btn btn-lg btn-success mt-2" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-1"></i>Tạo Danh Mục Đầu Tiên
                    </button>
                </div>
            )}

            {!isLoading && !pageError && categories.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-hover table-striped table-bordered align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th scope="col" style={{width: '5%', textAlign: 'center'}}>#</th>
                                <th scope="col">Tên Danh Mục</th>
                                <th scope="col" style={{width: '12%', textAlign: 'center'}}>Loại</th>
                                <th scope="col" style={{width: '8%', textAlign: 'center'}}>Màu</th>
                                <th scope="col" style={{width: '15%', textAlign: 'center'}}>Icon</th>
                                <th scope="col" style={{width: '20%'}}>Chú thích</th>
                                <th scope="col" style={{width: '10%', textAlign: 'center'}}>Mặc định?</th>
                                <th scope="col" style={{width: '15%', textAlign: 'center'}}>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category, index) => (
                                <tr key={category.id}>
                                    <th scope="row" style={{textAlign: 'center'}}>{index + 1}</th>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <i className={`${getIconBsClass(category.icon) || 'bi-tag-fill'} me-2 fs-5`}
                                               style={{color: category.color || (category.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR)}}>
                                            </i>
                                            {category.name}
                                        </div>
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        <span className={`badge ${category.type === 'income' ? 'bg-success-soft text-success-emphasis' : 'bg-danger-soft text-danger-emphasis'}`} style={{fontSize: '0.85em'}}>
                                            {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                                        </span>
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        <div style={{
                                            width: '22px', height: '22px',
                                            backgroundColor: category.color || (category.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR),
                                            borderRadius: '4px', border: '1px solid #adb5bd',
                                            display: 'inline-block',
                                        }} title={`Màu: ${category.color}`}></div>
                                    </td>
                                    <td style={{textAlign: 'center'}} title={getIconLabel(category.icon)}>
                                        {category.icon ? <i className={`${getIconBsClass(category.icon)} fs-4`}></i> : '-'}
                                    </td>
                                    <td className="small text-muted" title={category.description}>
                                        {category.description ? (category.description.length > 40 ? category.description.substring(0, 40) + '...' : category.description) : '-'}
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        {category.isDefault ? <span className="badge bg-info-soft text-info-emphasis">Có</span> : <span className="badge bg-secondary-soft text-secondary-emphasis">Không</span>}
                                    </td>
                                    <td style={{textAlign: 'center'}}>
                                        <button
                                            onClick={() => handleOpenEditModal(category)}
                                            className="btn btn-sm btn-outline-primary me-1 px-2 py-1"
                                            title="Sửa danh mục"
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        {!category.isDefault && (
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="btn btn-sm btn-outline-danger px-2 py-1"
                                                title="Xóa danh mục"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <CategoryFormModal
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitCategory}
                    categoryToEdit={categoryToEdit}
                />
            )}
        </div>
    );
}
// --- Kết thúc định nghĩa CategoryManagement ---

export default CategoryManagement;