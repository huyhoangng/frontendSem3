// src/components/budgets/BudgetsManagement.js

import React, { useState, useEffect, useCallback } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../service/budgetService';
import { getCategories } from '../service/categoryService';

// =====================================================================================
// HELPER FUNCTIONS (Hàm hỗ trợ)
// =====================================================================================

const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
};


// =====================================================================================
// BUDGET FORM MODAL COMPONENT (Định nghĩa component Modal ngay tại đây)
// =====================================================================================

const BudgetFormModal = ({ onClose, onSubmit, budgetToEdit, categories }) => {
    // ... Nội dung của component này không thay đổi, giữ nguyên như cũ ...
    const [formData, setFormData] = useState({
        budgetName: '',
        budgetAmount: '',
        budgetPeriod: 'Monthly',
        startDate: '',
        endDate: '',
        alertThreshold: 80,
        categoryId: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (budgetToEdit) {
            setFormData({
                id: budgetToEdit.id,
                budgetName: budgetToEdit.budgetName,
                budgetAmount: budgetToEdit.budgetAmount,
                budgetPeriod: budgetToEdit.budgetPeriod,
                startDate: budgetToEdit.startDate ? new Date(budgetToEdit.startDate).toISOString().split('T')[0] : '',
                endDate: budgetToEdit.endDate ? new Date(budgetToEdit.endDate).toISOString().split('T')[0] : '',
                alertThreshold: budgetToEdit.alertThreshold,
                categoryId: budgetToEdit.categoryId.toString()
            });
        } else {
            const today = new Date();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setFormData({
                budgetName: '',
                budgetAmount: '',
                budgetPeriod: 'Monthly',
                startDate: today.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                alertThreshold: 80,
                categoryId: ''
            });
        }
    }, [budgetToEdit]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.budgetName.trim()) newErrors.budgetName = 'Budget name is required';
        if (!formData.budgetAmount) newErrors.budgetAmount = 'Budget amount is required';
        else if (isNaN(formData.budgetAmount) || parseFloat(formData.budgetAmount) <= 0) newErrors.budgetAmount = 'Budget amount must be a positive number';
        if (!formData.budgetPeriod) newErrors.budgetPeriod = 'Budget period is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) newErrors.endDate = 'End date must be after start date';
        if (formData.alertThreshold && (isNaN(formData.alertThreshold) || formData.alertThreshold < 0 || formData.alertThreshold > 100)) newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                budgetAmount: parseFloat(formData.budgetAmount),
                alertThreshold: parseFloat(formData.alertThreshold),
                categoryId: parseInt(formData.categoryId, 10),
            };
            await onSubmit(payload);
            onClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to save budget. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="modal-header">
                            <h5 className="modal-title">{budgetToEdit ? 'Edit Budget' : 'Add New Budget'}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}
                            <div className="mb-3">
                                <label htmlFor="budgetName" className="form-label">Budget Name</label>
                                <input type="text" className={`form-control ${errors.budgetName ? 'is-invalid' : ''}`} id="budgetName" name="budgetName" value={formData.budgetName} onChange={handleChange} required />
                                {errors.budgetName && <div className="invalid-feedback">{errors.budgetName}</div>}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="budgetAmount" className="form-label">Budget Amount</label>
                                <div className="input-group">
                                    <span className="input-group-text">$</span>
                                    <input type="number" className={`form-control ${errors.budgetAmount ? 'is-invalid' : ''}`} id="budgetAmount" name="budgetAmount" value={formData.budgetAmount} onChange={handleChange} min="0" required />
                                </div>
                                {errors.budgetAmount && <div className="invalid-feedback">{errors.budgetAmount}</div>}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="budgetPeriod" className="form-label">Budget Period</label>
                                <select className={`form-select ${errors.budgetPeriod ? 'is-invalid' : ''}`} id="budgetPeriod" name="budgetPeriod" value={formData.budgetPeriod} onChange={handleChange} required>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Yearly">Yearly</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                                {errors.budgetPeriod && <div className="invalid-feedback">{errors.budgetPeriod}</div>}
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="startDate" className="form-label">Start Date</label>
                                    <input type="date" className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required />
                                    {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="endDate" className="form-label">End Date</label>
                                    <input type="date" className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required />
                                    {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="alertThreshold" className="form-label">Alert Threshold (%)</label>
                                <input type="number" className={`form-control ${errors.alertThreshold ? 'is-invalid' : ''}`} id="alertThreshold" name="alertThreshold" value={formData.alertThreshold} onChange={handleChange} min="0" max="100" />
                                {errors.alertThreshold && <div className="invalid-feedback">{errors.alertThreshold}</div>}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="categoryId" className="form-label">Category</label>
                                <select className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`} id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                                    <option value="">Select a category</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                {errors.categoryId && <div className="invalid-feedback">{errors.categoryId}</div>}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Budget'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// =====================================================================================
// MAIN BUDGET MANAGEMENT COMPONENT (Component chính)
// =====================================================================================

const BudgetManagement = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [budgetToEdit, setBudgetToEdit] = useState(null);
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApiError = useCallback((error, context = 'operation') => {
        let message = `Error during ${context}.`;
        if (error.response) {
            if (error.response.status === 401) {
                message = 'Session expired. Redirecting to login...';
            } else {
                message = error.response.data?.message || `Server error (${error.response.status}).`;
            }
        } else {
            message = error.message || `Unknown error.`;
        }
        setPageError(message);
        console.error(`API Error (${context}):`, error);
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setPageError('');
        try {
            const [budgetsData, categoriesData] = await Promise.all([getBudgets(), getCategories()]);
            setBudgets(budgetsData || []);
            setCategories(categoriesData.filter(cat => cat.isActive) || []);
        } catch (error) {
            handleApiError(error, 'fetching data');
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmitBudget = async (budgetData) => {
        setIsProcessing(true);
        try {
            if (budgetToEdit) {
                await updateBudget(budgetToEdit.id, budgetData);
                alert('Budget updated successfully!');
            } else {
                await createBudget(budgetData);
                alert('Budget created successfully!');
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            handleApiError(error, 'saving budget');
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteClick = (budget) => {
        setDeleteConfirmation({ id: budget.id, name: budget.budgetName, amount: formatCurrency(budget.budgetAmount) });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        setIsProcessing(true);
        try {
            await deleteBudget(deleteConfirmation.id);
            alert('Budget deleted successfully!');
            await fetchData();
        } catch (error) {
            handleApiError(error, 'deleting budget');
        } finally {
            setIsProcessing(false);
            setDeleteConfirmation(null);
        }
    };

    const handleOpenAddBudgetModal = () => {
        if (categories.length > 0) {
            setBudgetToEdit(null);
            setIsModalOpen(true);
        } else {
            alert("Please create categories first.");
        }
    };

    const handleOpenEditBudgetModal = (budget) => {
        setBudgetToEdit(budget);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBudgetToEdit(null);
    };

    // THAY ĐỔI Ở ĐÂY: Hàm calculateProgress được cập nhật
    const calculateProgress = (budget) => {
        // Thêm kiểm tra an toàn
        if (!budget || typeof budget.budgetAmount !== 'number' || budget.budgetAmount <= 0) {
            return { percentage: 0, thresholdReached: false, remaining: 0 };
        }
        const spent = budget.spentAmount || 0;
        const percentage = (spent / budget.budgetAmount) * 100;
        // Sử dụng alertThreshold để xác định trạng thái
        const thresholdReached = budget.alertThreshold ? (percentage >= budget.alertThreshold) : false;

        return {
            percentage: Math.min(percentage, 100),
            thresholdReached, // Trả về trạng thái ngưỡng
            remaining: budget.budgetAmount - spent
        };
    };

    const filteredBudgets = budgets.filter(budget =>
        (!filterPeriod || budget.budgetPeriod === filterPeriod) &&
        (!filterCategory || String(budget.categoryId) === String(filterCategory))
    );

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2 mb-0">Budget Management</h1>
                <button className="btn btn-primary" onClick={handleOpenAddBudgetModal} disabled={categories.length === 0}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Add Budget
                </button>
            </div>

            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <h5 className="card-title mb-3">Filters</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="filterPeriod" className="form-label">Period</label>
                            <select id="filterPeriod" className="form-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
                                <option value="">All Periods</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="filterCategory" className="form-label">Category</label>
                            <select id="filterCategory" className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} disabled={categories.length === 0}>
                                <option value="">All Categories</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && <div className="text-center my-5"><div className="spinner-border text-primary"></div></div>}
            {pageError && !isLoading && <div className="alert alert-danger">{pageError}</div>}
            
            {!isLoading && !pageError && (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Budget Details</th>
                                    <th>Category</th>
                                    <th className="text-end">Amount</th>
                                    <th>Period</th>
                                    <th>Dates</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBudgets.length > 0 ? filteredBudgets.map(budget => {
                                    const progress = calculateProgress(budget);
                                    const category = categories.find(cat => cat.id === budget.categoryId);
                                    return (
                                        <tr key={budget.id}>
                                            <td>
                                                <div className="fw-bold">{budget.budgetName}</div>
                                                <div className="progress mt-1" style={{ height: '8px' }}>
                                                    {/* THAY ĐỔI Ở ĐÂY: Màu sắc progress bar dựa vào thresholdReached */}
                                                    <div className={`progress-bar ${progress.thresholdReached ? 'bg-danger' : 'bg-success'}`} role="progressbar" style={{ width: `${progress.percentage}%` }}></div>
                                                </div>
                                                <small className="text-muted">
                                                    {formatCurrency(budget.spentAmount || 0)} spent
                                                    {/* THAY ĐỔI Ở ĐÂY: Hiển thị icon cảnh báo */}
                                                    {progress.thresholdReached && (
                                                        <span className="text-danger ms-2" title="Spending has reached the alert threshold">
                                                            <i className="bi bi-exclamation-triangle-fill"></i>
                                                        </span>
                                                    )}
                                                </small>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ backgroundColor: category?.color || '#6c757d', color: 'white' }}>
                                                    {category?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <div className="fw-bold">{formatCurrency(budget.budgetAmount)}</div>
                                                <small className={progress.remaining < 0 ? 'text-danger' : 'text-success'}>
                                                    {formatCurrency(progress.remaining)} left
                                                </small>
                                            </td>
                                            <td>{budget.budgetPeriod}</td>
                                            <td>{formatDate(budget.startDate)} - {formatDate(budget.endDate)}</td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleOpenEditBudgetModal(budget)} title="Edit Budget" disabled={isProcessing}><i className="bi bi-pencil-fill"></i></button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(budget)} title="Delete Budget" disabled={isProcessing}><i className="bi bi-trash3-fill"></i></button>
                                            </td>
                                        </tr>
                                    );
                                }) : <tr><td colSpan="6" className="text-center p-4">No budgets found for the selected filters.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isModalOpen && <BudgetFormModal onClose={handleCloseModal} onSubmit={handleSubmitBudget} budgetToEdit={budgetToEdit} categories={categories} />}

            {deleteConfirmation && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm Deletion</h5>
                                <button type="button" className="btn-close" onClick={() => setDeleteConfirmation(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete the budget "<strong>{deleteConfirmation.name}</strong>"?</p>
                                <p className="text-danger">This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmation(null)} disabled={isProcessing}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={isProcessing}>
                                    {isProcessing ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetManagement;