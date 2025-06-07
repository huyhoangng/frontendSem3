// src/component/category/CategoryManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as categoryService from '../service/categoryService'; // <<--- **QUAN TRỌNG: KIỂM TRA ĐƯỜNG DẪN NÀY!**

// Define color constants
const DEFAULT_EXPENSE_COLOR = '#FF5733';
const DEFAULT_INCOME_COLOR = '#00FF00';

// Suggested icons for Bootstrap Icons
const suggestedIcons = [
  { value: 'tag-fill', label: 'Tag (Default)', bsClass: 'bi-tag-fill' },
  { value: 'house-door-fill', label: 'Housing', bsClass: 'bi-house-door-fill' },
  { value: 'cart-fill', label: 'Shopping', bsClass: 'bi-cart-fill' },
  // ... (giữ nguyên danh sách icons đầy đủ của bạn) ...
  { value: 'money-bill', label: 'Cash', bsClass: 'bi-piggy-bank-fill' },
];

// Basic color suggestions
const basicColors = [
  '#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd',
  // ... (giữ nguyên danh sách màu đầy đủ của bạn) ...
  '#20c997', '#0dcaf0'
];

// Category Form Modal Component
const CategoryFormModal = ({ onClose, onSubmit, categoryToEdit }) => {
  // ... (TOÀN BỘ CODE CỦA CategoryFormModal GIỮ NGUYÊN NHƯ PHIÊN BẢN BẠN ĐÃ GỬI Ở TRÊN)
  // (Bao gồm initialFormState, useEffects, handleChange, handleColorButtonClick, handleSubmit, JSX)
  // Đảm bảo trong handleSubmit, bạn gọi toast.success và toast.error
  const initialFormState = {
    name: '',
    type: 'expense',
    icon: suggestedIcons[0].value,
    color: DEFAULT_EXPENSE_COLOR,
    description: '',
    isDefault: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState(''); // Lỗi hiển thị trong modal

  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name || '',
        type: categoryToEdit.type || 'expense',
        icon: categoryToEdit.icon || suggestedIcons[0].value,
        color: categoryToEdit.color || (categoryToEdit.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR),
        description: categoryToEdit.description || '',
        isDefault: categoryToEdit.isDefault || false,
      });
    } else {
      const defaultColorBasedOnType = initialFormState.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR;
      setFormData({ ...initialFormState, color: defaultColorBasedOnType, icon: suggestedIcons[0].value });
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
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset lỗi inline trước khi submit
    if (!formData.name.trim()) {
      const msg = 'Category name cannot be empty.';
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onSubmit(formData); // Gọi handleSubmitCategory từ cha
      // toast.success đã được gọi trong handleSubmitCategory nếu thành công và đóng modal
      // onClose(); // Cha sẽ gọi onClose nếu submit thành công
    } catch (err) {
      // Lỗi đã được ném từ handleSubmitCategory, hiển thị nó
      const message = err.message || 'An error occurred while saving the category.';
      setError(message); // Hiển thị lỗi inline trong modal
      // toast.error(message); // Không cần toast ở đây nữa nếu cha đã toast
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
                  <h2 className="h4 mb-0">{categoryToEdit ? 'Edit Category' : 'Add New Category'}</h2>
                  <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {error && <div className="alert alert-danger py-2 mb-3">{error}</div>} {/* Lỗi inline */}
                <form onSubmit={handleSubmit}>
                  {/* Form fields (giữ nguyên như bạn đã cung cấp) */}
                  <div className="mb-3">
                    <label htmlFor="modal-category-name" className="form-label fw-bold">Category Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control" type="text" id="modal-category-name" name="name"
                      value={formData.name} onChange={handleChange} required placeholder="E.g., Dining, Salary"
                    />
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="modal-category-type" className="form-label fw-bold">Type</label>
                      <select
                        className="form-select" id="modal-category-type" name="type"
                        value={formData.type} onChange={handleChange}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="modal-category-icon" className="form-label fw-bold">Icon</label>
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
                    <label className="form-label fw-bold d-block">Color</label>
                    <div className="d-flex align-items-center flex-wrap">
                      <input
                        type="color"
                        className="form-control form-control-color me-2 mb-2"
                        id="modal-category-color-picker"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        title="Choose custom color"
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
                          title={`Select color ${colorHex}`}
                        >
                           
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="modal-category-description" className="form-label fw-bold">Description (Optional)</label>
                    <textarea
                      className="form-control"
                      id="modal-category-description"
                      name="description"
                      rows="2"
                      placeholder="Additional notes about this category..."
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
                      Set as default category?
                    </label>
                  </div>
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{categoryToEdit ? 'Save Changes' : 'Add Category'}</button>
                  </div>
                </form>
            </div>
        </div>
    );
};

// Main Category Management Component
function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState(null); // Lỗi hiển thị trên trang chính
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const handleApiError = (err, context = "operation") => {
    let message = err.message || `An error occurred during ${context}.`;
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      message = 'Session expired or invalid. Redirecting to login...';
      localStorage.removeItem('authToken'); // Xóa token
      toast.error(message); // Toast trước khi chuyển hướng
      setTimeout(() => {
        window.location.href = '/login'; // Chuyển hướng cứng
      }, 2500);
    } else {
      toast.error(message); // Toast cho các lỗi khác
    }
    setPageError(message); // Hiển thị lỗi trên trang
  };

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const data = await categoryService.getCategories();
      setCategories(data || []);
    } catch (err) {
      handleApiError(err, "loading categories");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Thêm handleApiError vào dependency nếu nó thay đổi, nhưng hiện tại nó ổn định

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
        await categoryService.updateCategory(categoryToEdit.id, formDataFromModal);
        toast.success('Category updated successfully!');
      } else {
        await categoryService.createCategory(formDataFromModal);
        toast.success('Category created successfully!');
      }
      await fetchCategories();
      handleCloseModal(); // Đóng modal sau khi thành công
    } catch (err) {
      // Lỗi đã được log bởi service, hàm handleApiError sẽ hiển thị toast
      // và có thể setPageError nếu cần.
      // Ném lại lỗi để CategoryFormModal có thể bắt và hiển thị lỗi inline của nó.
      handleApiError(err, "saving category");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    // Tìm category để kiểm tra isDefault trước khi xác nhận xóa
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (categoryToDelete && categoryToDelete.isDefault) {
        toast.warn("Default categories cannot be deleted.");
        return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      setIsLoading(true);
      setPageError(null);
      try {
        await categoryService.deleteCategory(id);
        toast.success('Category deleted successfully!'); // THÊM THÔNG BÁO THÀNH CÔNG
        await fetchCategories();
      } catch (err) {
        handleApiError(err, "deleting category");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getIconBsClass = (iconValue) => { /* ... giữ nguyên ... */ };
  const getIconLabel = (iconValue) => { /* ... giữ nguyên ... */ };

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored"/>
      {/* ... (JSX cho header và thông báo loading/error/no categories giữ nguyên) ... */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <h1 className="h2 mb-2 mb-md-0">Category Management</h1>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
            <i className="bi bi-plus-circle-fill me-2"></i>Add New Category
            </button>
        </div>

        {isLoading && <div className="alert alert-info text-center">Processing...</div>}
        {pageError && !isLoading && <div className="alert alert-danger text-center">Error: {pageError}</div>} {/* Chỉ hiện pageError khi không loading */}

        {!isLoading && !pageError && categories.length === 0 && (
            <div className="text-center p-5 border rounded bg-light shadow-sm">
            <i className="bi bi-tags-fill" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            <h4 className="mt-3 mb-2">No Categories Yet</h4>
            <p className="text-muted">Create a category to start organizing your income and expenses.</p>
            <button className="btn btn-lg btn-success mt-2" onClick={handleOpenAddModal}>
                <i className="bi bi-plus-lg me-1"></i>Create First Category
            </button>
            </div>
        )}


      {!isLoading && !pageError && categories.length > 0 && (
        <div className="table-responsive">
          {/* ... (JSX của Table giữ nguyên) ... */}
          <table className="table table-hover table-striped table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th scope="col" style={{width: '5%', textAlign: 'center'}}>#</th>
                <th scope="col">Category Name</th>
                <th scope="col" style={{width: '12%', textAlign: 'center'}}>Type</th>
                <th scope="col" style={{width: '8%', textAlign: 'center'}}>Color</th>
                <th scope="col" style={{width: '15%', textAlign: 'center'}}>Icon</th>
                <th scope="col" style={{width: '20%'}}>Description</th>
                <th scope="col" style={{width: '10%', textAlign: 'center'}}>Default?</th>
                <th scope="col" style={{width: '15%', textAlign: 'center'}}>Actions</th>
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
                      {category.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{
                      width: '22px', height: '22px',
                      backgroundColor: category.color || (category.type === 'income' ? DEFAULT_INCOME_COLOR : DEFAULT_EXPENSE_COLOR),
                      borderRadius: '4px', border: '1px solid #adb5bd',
                      display: 'inline-block',
                    }} title={`Color: ${category.color}`}></div>
                  </td>
                  <td style={{textAlign: 'center'}} title={getIconLabel(category.icon)}>
                    {category.icon ? <i className={`${getIconBsClass(category.icon)} fs-4`}></i> : '-'}
                  </td>
                  <td className="small text-muted" title={category.description}>
                    {category.description ? (category.description.length > 40 ? category.description.substring(0, 40) + '...' : category.description) : '-'}
                  </td>
                  <td style={{textAlign: 'center'}}>
                    {category.isDefault ? <span className="badge bg-info-soft text-info-emphasis">Yes</span> : <span className="badge bg-secondary-soft text-secondary-emphasis">No</span>}
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <button
                      onClick={() => handleOpenEditModal(category)}
                      className="btn btn-sm btn-outline-primary me-1 px-2 py-1"
                      title="Edit category"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    {!category.isDefault && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        title="Delete category"
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

export default CategoryManagement;