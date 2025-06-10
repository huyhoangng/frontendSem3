// src/components/BudgetManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../service/budgetService';
import { getCategories } from '../service/categoryService';
import { getAccounts } from '../service/accountService';

const formatCurrency = (amount, currency = 'VND') => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB');
};

const normalizeBudgetForState = (apiBudget) => {
    return {
        id: apiBudget.budgetId,
        budgetName: apiBudget.budgetName,
        budgetAmount: apiBudget.budgetAmount,
        budgetPeriod: apiBudget.budgetPeriod,
        startDate: apiBudget.startDate,
        endDate: apiBudget.endDate,
        spentAmount: apiBudget.spentAmount,
        alertThreshold: apiBudget.alertThreshold,
        isActive: apiBudget.isActive,
        categoryId: apiBudget.categoryId
    };
};

const BudgetFormModal = ({ onClose, onSubmit, budgetToEdit, categories }) => {
    const [formData, setFormData] = useState({
        budgetName: '',
        budgetAmount: '',
        budgetPeriod: 'Monthly', // Set default to Monthly
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
            // Set default values for new budget
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
        
        // Validate budgetName
        if (!formData.budgetName.trim()) {
            newErrors.budgetName = 'Budget name is required';
        }

        // Validate budgetAmount
        if (!formData.budgetAmount) {
            newErrors.budgetAmount = 'Budget amount is required';
        } else if (isNaN(formData.budgetAmount) || parseFloat(formData.budgetAmount) <= 0) {
            newErrors.budgetAmount = 'Budget amount must be a positive number';
        }

        // Validate budgetPeriod
        const validPeriods = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
        if (!formData.budgetPeriod) {
            newErrors.budgetPeriod = 'Budget period is required';
        } else if (!validPeriods.includes(formData.budgetPeriod)) {
            newErrors.budgetPeriod = 'Budget period must be one of: Weekly, Monthly, Quarterly, Yearly';
        }

        // Validate dates
        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start > end) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        // Validate alertThreshold
        if (formData.alertThreshold) {
            const threshold = parseFloat(formData.alertThreshold);
            if (isNaN(threshold) || threshold < 0 || threshold > 100) {
                newErrors.alertThreshold = 'Alert threshold must be between 0 and 100';
            }
        }

        // Validate category
        if (!formData.categoryId) {
            newErrors.categoryId = 'Category is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                budgetName: formData.budgetName.trim(),
                budgetAmount: parseFloat(formData.budgetAmount),
                budgetPeriod: formData.budgetPeriod,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                alertThreshold: parseFloat(formData.alertThreshold),
                categoryId: parseInt(formData.categoryId, 10)
            };

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error('Error submitting budget:', error);
            setErrors({
                submit: error.message || 'Failed to save budget. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        
        // Special handling for budgetPeriod
        if (name === 'budgetPeriod') {
            const validPeriods = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
            if (!validPeriods.includes(value)) {
                setErrors(prev => ({
                    ...prev,
                    budgetPeriod: 'Please select a valid period: Weekly, Monthly, Quarterly, or Yearly'
                }));
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {budgetToEdit ? 'Edit Budget' : 'Add New Budget'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {errors.submit && (
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {errors.submit}
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="budgetName" className="form-label required">Budget Name</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.budgetName ? 'is-invalid' : ''}`}
                                    id="budgetName"
                                    name="budgetName"
                                    value={formData.budgetName}
                                    onChange={handleChange}
                                    placeholder="Enter budget name"
                                />
                                {errors.budgetName && (
                                    <div className="invalid-feedback">
                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                        {errors.budgetName}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="budgetAmount" className="form-label required">Budget Amount</label>
                                <div className="input-group">
                                    <span className="input-group-text">₫</span>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.budgetAmount ? 'is-invalid' : ''}`}
                                        id="budgetAmount"
                                        name="budgetAmount"
                                        value={formData.budgetAmount}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                {errors.budgetAmount && (
                                    <div className="invalid-feedback">
                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                        {errors.budgetAmount}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="budgetPeriod" className="form-label required">
                                    Budget Period
                                    <i className="bi bi-info-circle ms-1" 
                                       title="Select the frequency of this budget: Weekly, Monthly, Quarterly, or Yearly"></i>
                                </label>
                                <select
                                    className={`form-select ${errors.budgetPeriod ? 'is-invalid' : ''}`}
                                    id="budgetPeriod"
                                    name="budgetPeriod"
                                    value={formData.budgetPeriod}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select period</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                                {errors.budgetPeriod && (
                                    <div className="invalid-feedback d-flex align-items-center">
                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                        {errors.budgetPeriod}
                                    </div>
                                )}
                                <small className="form-text text-muted">
                                    Choose how often this budget will be reset: Weekly, Monthly, Quarterly, or Yearly
                                </small>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="startDate" className="form-label required">Start Date</label>
                                    <input
                                        type="date"
                                        className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                    />
                                    {errors.startDate && (
                                        <div className="invalid-feedback">
                                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                                            {errors.startDate}
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="endDate" className="form-label required">End Date</label>
                                    <input
                                        type="date"
                                        className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                        id="endDate"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                    />
                                    {errors.endDate && (
                                        <div className="invalid-feedback">
                                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                                            {errors.endDate}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="alertThreshold" className="form-label">
                                    Alert Threshold (%)
                                    <i className="bi bi-info-circle ms-1" 
                                       title="Percentage of budget spent that triggers an alert"></i>
                                </label>
                                <input
                                    type="number"
                                    className={`form-control ${errors.alertThreshold ? 'is-invalid' : ''}`}
                                    id="alertThreshold"
                                    name="alertThreshold"
                                    value={formData.alertThreshold}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                                {errors.alertThreshold && (
                                    <div className="invalid-feedback">
                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                        {errors.alertThreshold}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="categoryId" className="form-label required">Category</label>
                                <select
                                    className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryId && (
                                    <div className="invalid-feedback">
                                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                                        {errors.categoryId}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Budget'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

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
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                setTimeout(() => {
                    if (window.location.pathname !== '/login') window.location.href = '/login';
                }, 3000);
            } else {
                message = error.response.data?.message || error.response.data?.title || `Server error (${error.response.status}).`;
            }
        } else if (error.request) {
            message = `Network error. Please check your connection.`;
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
            const [budgetsData, categoriesData] = await Promise.all([
                getBudgets(),
                getCategories()
            ]);
            
            setBudgets(budgetsData);
            setCategories(categoriesData.filter(cat => cat.isActive));
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
                console.log('Updating budget:', budgetToEdit.id, budgetData);
                await updateBudget(budgetToEdit.id, budgetData);
                alert('Budget updated successfully!');
            } else {
                console.log('Creating new budget:', budgetData);
                await createBudget(budgetData);
                alert('Budget created successfully!');
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving budget:', error);
            let errorMessage = 'Failed to save budget. ';
            if (error.message.includes('session has expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else if (error.message.includes('not found')) {
                errorMessage = 'The budget you are trying to update no longer exists.';
            } else if (error.message.includes('Invalid budget data')) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteBudget = async (budget) => {
        setDeleteConfirmation({
            id: budget.id,
            name: budget.budgetName,
            amount: formatCurrency(budget.budgetAmount)
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        setIsProcessing(true);
        try {
            console.log('Deleting budget:', deleteConfirmation.id);
            await deleteBudget(deleteConfirmation.id);
            alert('Budget deleted successfully!');
            await fetchData();
        } catch (error) {
            console.error('Error deleting budget:', error);
            let errorMessage = 'Failed to delete budget. ';
            if (error.message.includes('session has expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else if (error.message.includes('not found')) {
                errorMessage = 'The budget you are trying to delete no longer exists.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'You do not have permission to delete this budget.';
            }
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
            setDeleteConfirmation(null);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation(null);
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

    const calculateProgress = (budget) => {
        const percentage = (budget.spentAmount / budget.budgetAmount) * 100;
        const thresholdReached = percentage >= budget.alertThreshold;
        return {
            percentage: Math.min(percentage, 100),
            thresholdReached,
            remaining: budget.budgetAmount - budget.spentAmount
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
                <button 
                    className="btn btn-primary" 
                    onClick={handleOpenAddBudgetModal}
                    disabled={categories.length === 0}
                >
                    <i className="bi bi-plus-circle-fill me-2"></i>Add Budget
                </button>
            </div>

            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <h5 className="card-title mb-3">Filters</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="filterPeriod" className="form-label">Period</label>
                            <select 
                                id="filterPeriod" 
                                className="form-select" 
                                value={filterPeriod} 
                                onChange={e => setFilterPeriod(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="filterCategory" className="form-label">Category</label>
                            <select 
                                id="filterCategory" 
                                className="form-select" 
                                value={filterCategory} 
                                onChange={e => setFilterCategory(e.target.value)}
                                disabled={categories.length === 0}
                            >
                                <option value="">All</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                </div>
            )}

            {pageError && !isLoading && (
                <div className="alert alert-danger">{pageError}</div>
            )}

            {deleteConfirmation && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Confirm Delete
                                </h5>
                                <button type="button" className="btn-close" onClick={cancelDelete}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this budget?</p>
                                <div className="alert alert-warning">
                                    <strong>Budget Name:</strong> {deleteConfirmation.name}<br />
                                    <strong>Amount:</strong> {deleteConfirmation.amount}
                                </div>
                                <p className="text-danger">
                                    <i className="bi bi-exclamation-circle-fill me-1"></i>
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={cancelDelete}
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={confirmDelete}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash-fill me-2"></i>
                                            Delete Budget
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !pageError && (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Budget Name</th>
                                    <th>Category</th>
                                    <th className="text-end">Amount</th>
                                    <th>Period</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBudgets.length > 0 ? (
                                    filteredBudgets.map(budget => {
                                        const progress = calculateProgress(budget);
                                        const category = categories.find(cat => cat.id === budget.categoryId);
                                        
                                        return (
                                            <tr key={budget.id}>
                                                <td>
                                                    <div className="fw-bold">{budget.budgetName}</div>
                                                    <div className="progress mt-1" style={{ height: '5px' }}>
                                                        <div 
                                                            className={`progress-bar ${progress.thresholdReached ? 'bg-danger' : 'bg-success'}`}
                                                            role="progressbar"
                                                            style={{ width: `${progress.percentage}%` }}
                                                            aria-valuenow={progress.percentage}
                                                            aria-valuemin="0"
                                                            aria-valuemax="100"
                                                        />
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                                                        {progress.thresholdReached && (
                                                            <span className="text-danger ms-2">
                                                                <i className="bi bi-exclamation-triangle-fill"></i> Threshold reached
                                                            </span>
                                                        )}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span 
                                                        className="badge" 
                                                        style={{ 
                                                            backgroundColor: category?.color || '#6c757d',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        {category?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-bold">{formatCurrency(budget.budgetAmount)}</div>
                                                    <small className="text-muted">
                                                        Remaining: {formatCurrency(progress.remaining)}
                                                    </small>
                                                </td>
                                                <td>{budget.budgetPeriod}</td>
                                                <td>{formatDate(budget.startDate)}</td>
                                                <td>{formatDate(budget.endDate)}</td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary me-1" 
                                                        onClick={() => handleOpenEditBudgetModal(budget)}
                                                        title="Edit Budget"
                                                        disabled={isProcessing}
                                                    >
                                                        <i className="bi bi-pencil-fill"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger" 
                                                        onClick={() => handleDeleteBudget(budget)}
                                                        title="Delete Budget"
                                                        disabled={isProcessing}
                                                    >
                                                        <i className="bi bi-trash3-fill"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center p-4 text-muted">
                                            No budgets found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <BudgetFormModal 
                    onClose={handleCloseModal} 
                    onSubmit={handleSubmitBudget} 
                    budgetToEdit={budgetToEdit} 
                    categories={categories} 
                />
            )}
        </div>
    );
};

export default BudgetManagement;