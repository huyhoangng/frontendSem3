// src/component/category/CategoryManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- SỬA LỖI ĐƯỜNG DẪN ---
// Giả sử file này nằm trong `src/component/category/`,
// và service nằm trong `src/services/`.
// Đường dẫn đúng sẽ là đi lên 2 cấp.
import * as categoryService from '../service/categoryService'; 

// --- Constants ---
const DEFAULT_EXPENSE_COLOR = '#FF5733';
const DEFAULT_INCOME_COLOR = '#00FF00';

const suggestedIcons = [
  { value: 'bi-tag-fill', label: 'Tag (Default)' },
  { value: 'bi-house-door-fill', label: 'Housing' },
  { value: 'bi-cart-fill', label: 'Shopping' },
  { value: 'bi-cup-hot-fill', label: 'Food & Drink' },
  { value: 'bi-car-front-fill', label: 'Transportation' },
  { value: 'bi-heart-pulse-fill', label: 'Health' },
  { value: 'bi-film', label: 'Entertainment' },
  { value: 'bi-cash-coin', label: 'Salary' },
  { value: 'bi-piggy-bank-fill', label: 'Savings' },
  { value: 'bi-gift-fill', label: 'Gifts' },
];

const basicColors = [
  '#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd',
  '#6f42c1', '#d63384', '#6c757d', '#20c997', '#0dcaf0'
];

// --- CategoryFormModal Component (Tối ưu hóa một chút) ---
const CategoryFormModal = ({ onClose, onSubmit, categoryToEdit }) => {
    const getInitialState = useCallback(() => {
        if (categoryToEdit) {
            return {
                name: categoryToEdit.name || '',
                type: categoryToEdit.type || 'expense',
                icon: categoryToEdit.icon || suggestedIcons[0].value,
                color: categoryToEdit.color || (categoryToEdit.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR),
                description: categoryToEdit.description || '',
                isDefault: categoryToEdit.isDefault || false,
            };
        }
        return {
            name: '', type: 'expense', icon: suggestedIcons[0].value,
            color: DEFAULT_EXPENSE_COLOR, description: '', isDefault: false,
        };
    }, [categoryToEdit]);

    const [formData, setFormData] = useState(getInitialState);
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData(getInitialState());
    }, [getInitialState]);

    useEffect(() => {
        if (!categoryToEdit) { // Chỉ tự động đổi màu khi tạo mới
            setFormData(prev => ({
                ...prev,
                color: prev.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR
            }));
        }
    }, [formData.type, categoryToEdit]);
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim()) {
            const msg = 'Category name cannot be empty.';
            setError(msg);
            toast.error(msg);
            return;
        }
        try {
            await onSubmit(formData);
            onClose(); // Đóng modal khi submit thành công
        } catch (err) {
            const message = err.message || 'An error occurred while saving the category.';
            setError(message); // Hiển thị lỗi inline
            // Không cần toast ở đây vì hàm cha đã xử lý
        }
    };

    // JSX của Modal giữ nguyên như code của bạn
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1050, width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
                <form onSubmit={handleSubmit}>
                    {/* ... Toàn bộ JSX của form giữ nguyên ... */}
                    <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h4 mb-0">{categoryToEdit ? 'Edit Category' : 'Add New Category'}</h2><button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button></div>
                    {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
                    <div className="mb-3"><label htmlFor="modal-category-name" className="form-label fw-bold">Category Name <span className="text-danger">*</span></label><input className="form-control" type="text" id="modal-category-name" name="name" value={formData.name} onChange={handleChange} required placeholder="E.g., Dining, Salary" /></div>
                    <div className="row mb-3"><div className="col-md-6"><label htmlFor="modal-category-type" className="form-label fw-bold">Type</label><select className="form-select" id="modal-category-type" name="type" value={formData.type} onChange={handleChange}><option value="expense">Expense</option><option value="income">Income</option></select></div><div className="col-md-6"><label htmlFor="modal-category-icon" className="form-label fw-bold">Icon</label><select className="form-select" id="modal-category-icon" name="icon" value={formData.icon} onChange={handleChange}>{suggestedIcons.map(iconItem => <option key={iconItem.value} value={iconItem.value}>{iconItem.label}</option>)}</select></div></div>
                    <div className="mb-3"><label className="form-label fw-bold d-block">Color</label><div className="d-flex align-items-center flex-wrap"><input type="color" className="form-control form-control-color me-2 mb-2" id="modal-category-color-picker" name="color" value={formData.color} onChange={handleChange} title="Choose custom color" style={{ width: '50px', height: '40px', flexShrink: 0 }} />{basicColors.map(colorHex => <button type="button" key={colorHex} className="btn btn-sm me-1 mb-1 p-0" style={{ backgroundColor: colorHex, width: '30px', height: '30px', border: formData.color === colorHex ? '3px solid #0d6efd' : '1px solid #ddd', borderRadius: '4px' }} onClick={() => setFormData(prev => ({...prev, color: colorHex}))} title={`Select color ${colorHex}`}> </button>)}</div></div>
                    <div className="mb-3"><label htmlFor="modal-category-description" className="form-label fw-bold">Description (Optional)</label><textarea className="form-control" id="modal-category-description" name="description" rows="2" placeholder="Additional notes about this category..." value={formData.description} onChange={handleChange}></textarea></div>
                    <div className="form-check mb-3"><input className="form-check-input" type="checkbox" name="isDefault" id="modal-category-isDefault" checked={formData.isDefault} onChange={handleChange} /><label className="form-check-label" htmlFor="modal-category-isDefault">Set as default category?</label></div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top"><button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">{categoryToEdit ? 'Save Changes' : 'Add Category'}</button></div>
                </form>
            </div>
        </div>
    );
};


// --- Main CategoryManagement Component ---
function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    // --- CHUẨN HÓA: Hàm xử lý lỗi API tập trung ---
    const handleApiError = useCallback((err, context = "operation") => {
        let message = `An error occurred during ${context}.`;
        // Ưu tiên kiểm tra lỗi 401 Unauthorized
        if (err.response && err.response.status === 401) {
            message = 'Session expired or invalid. Redirecting to login...';
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            toast.error(message);
            setTimeout(() => {
                // Đảm bảo không chuyển hướng lặp lại nếu đã ở trang login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }, 3000);
        } else {
            // Lấy thông báo lỗi cụ thể từ response của Axios nếu có
            message = err.response?.data?.message || err.response?.data?.title || err.message;
            toast.error(message);
        }
        setPageError(message); // Hiển thị lỗi trên trang
        console.error(`API Error (${context}):`, err);
    }, []);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setPageError(null);
        try {
            const data = await categoryService.getCategories();
            setCategories(data || []);
        } catch (err) {
            handleApiError(err, "loading categories");
            setCategories([]); // Đảm bảo categories là mảng rỗng nếu có lỗi
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenAddModal = () => { setCategoryToEdit(null); setIsModalOpen(true); };
    const handleOpenEditModal = (category) => { setCategoryToEdit(category); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setCategoryToEdit(null); };

    const handleSubmitCategory = async (formDataFromModal) => {
        setIsLoading(true);
        try {
            if (categoryToEdit && categoryToEdit.id) {
                await categoryService.updateCategory(categoryToEdit.id, formDataFromModal);
                toast.success('Category updated successfully!');
            } else {
                await categoryService.createCategory(formDataFromModal);
                toast.success('Category created successfully!');
            }
            await fetchCategories();
        } catch (err) {
            handleApiError(err, "saving category");
            // Ném lỗi để form modal biết và hiển thị lỗi inline
            throw err;
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteCategory = async (id) => {
        const categoryToDelete = categories.find(cat => cat.id === id);
        if (categoryToDelete && categoryToDelete.isDefault) {
            toast.warn("Default categories cannot be deleted.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this category?')) {
            setIsLoading(true);
            try {
                await categoryService.deleteCategory(id);
                toast.success('Category deleted successfully!');
                await fetchCategories();
            } catch (err) {
                handleApiError(err, "deleting category");
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    // Hàm getIconBsClass nên trả về chuỗi class của Bootstrap Icons
    const getIconBsClass = (iconValue) => suggestedIcons.find(icon => icon.value === iconValue)?.value || 'bi-tag-fill';

    return (
        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored"/>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Category Management</h1>
                <button onClick={handleOpenAddModal} className="btn btn-primary"><i className="bi bi-plus-circle-fill me-2"></i>Add New Category</button>
            </div>

            {isLoading && <div className="text-center my-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div></div>}
            {pageError && !isLoading && <div className="alert alert-danger">{pageError}</div>}

            {!isLoading && !pageError && (
                categories.length > 0 ? (
                    <div className="table-responsive card shadow-sm">
                        <table className="table table-hover table-striped align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col" style={{width: '5%', textAlign: 'center'}}>Icon</th>
                                    <th scope="col">Category Name</th>
                                    <th scope="col" style={{width: '12%', textAlign: 'center'}}>Type</th>
                                    <th scope="col" style={{width: '25%'}}>Description</th>
                                    <th scope="col" style={{width: '10%', textAlign: 'center'}}>Default?</th>
                                    <th scope="col" style={{width: '15%', textAlign: 'center'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(category => (
                                    // SỬA LỖI KEY: Đảm bảo mỗi dòng có một key duy nhất
                                    <tr key={category.id}>
                                        <td style={{textAlign: 'center'}}>
                                            <i className={getIconBsClass(category.icon)} style={{ color: category.color, fontSize: '1.5rem' }}></i>
                                        </td>
                                        <td>{category.name}</td>
                                        <td style={{textAlign: 'center'}}>
                                            <span className={`badge text-capitalize ${category.type === 'income' ? 'bg-success-soft text-success-emphasis' : 'bg-danger-soft text-danger-emphasis'}`}>{category.type}</span>
                                        </td>
                                        <td className="small text-muted">{category.description || '-'}</td>
                                        <td style={{textAlign: 'center'}}>{category.isDefault ? 'Yes' : 'No'}</td>
                                        <td style={{textAlign: 'center'}}>
                                            <button onClick={() => handleOpenEditModal(category)} className="btn btn-sm btn-outline-primary me-1 px-2 py-1" title="Edit"><i className="bi bi-pencil-square"></i></button>
                                            {!category.isDefault && (
                                                <button onClick={() => handleDeleteCategory(category.id)} className="btn btn-sm btn-outline-danger px-2 py-1" title="Delete"><i className="bi bi-trash-fill"></i></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center p-5 border rounded bg-light"><i className="bi bi-tags-fill" style={{ fontSize: '3rem', color: '#6c757d' }}></i><h4 className="mt-3 mb-2">No Categories Yet</h4><p className="text-muted">Create a category to start organizing.</p><button className="btn btn-lg btn-success mt-2" onClick={handleOpenAddModal}><i className="bi bi-plus-lg me-1"></i>Create First Category</button></div>
                )
            )}

            {isModalOpen && <CategoryFormModal onClose={handleCloseModal} onSubmit={handleSubmitCategory} categoryToEdit={categoryToEdit} />}
        </div>
    );
}

export default CategoryManagement;