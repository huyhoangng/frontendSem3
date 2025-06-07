import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// --- API Configuration ---
const API_BASE_URL_BUDGETS = 'http://localhost:7166/api/budgets';
const API_BASE_URL_CATEGORIES = 'http://localhost:7166/api/categories';

const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn("Auth token not found in localStorage.");
        throw new Error("Authentication token is missing. Please log in.");
    }
    return token;
};

const createAxiosInstance = (baseURL) => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        const userId = localStorage.getItem('userId');
        if (userId) {
            headers['X-User-ID'] = userId; // Thêm userId nếu backend yêu cầu
        }
    }
    return axios.create({
        baseURL,
        headers,
    });
};

// --- Normalization Functions ---
const normalizeBudgetFromApi = (apiBudget) => {
    const startDate = apiBudget.startDate && !isNaN(new Date(apiBudget.startDate).getTime())
        ? new Date(apiBudget.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const endDate = apiBudget.endDate && !isNaN(new Date(apiBudget.endDate).getTime())
        ? new Date(apiBudget.endDate).toISOString().slice(0, 10)
        : startDate;
    return {
        id: apiBudget.id || uuidv4(),
        budgetName: apiBudget.budgetName || '',
        budgetAmount: Math.abs(apiBudget.budgetAmount) || 0,
        budgetPeriod: ['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(apiBudget.budgetPeriod) ? apiBudget.budgetPeriod : 'Monthly',
        startDate,
        endDate,
        alertThreshold: Math.abs(apiBudget.alertThreshold) || 0,
        categoryId: apiBudget.categoryId || '',
    };
};

const normalizeCategoryFromApi = (apiCategory) => {
    return {
        id: apiCategory.id || '',
        name: apiCategory.name || '',
        type: apiCategory.categoryType?.toLowerCase() || '',
        description: apiCategory.description || '',
        color: apiCategory.color || '#6c757d',
        icon: apiCategory.icon || '',
        isDefault: apiCategory.isDefault || false,
    };
};

// --- Helper Function ---
const formatCurrency = (amount, currency = 'VND') => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
};

// --- API Call Functions ---
const apiGetBudgets = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/');
        console.log('Budgets API response:', response.data); // Log để kiểm tra
        const budgetsData = Array.isArray(response.data) ? response.data : response.data.budgets || [];
        if (!Array.isArray(budgetsData)) {
            console.error('Budgets API did not return an array:', budgetsData);
            throw new Error('Budgets data is not an array.');
        }
        return budgetsData.map(normalizeBudgetFromApi);
    } catch (error) {
        console.error('API Error - getBudgets:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch budgets.');
    }
};

const apiGetCategories = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/');
        console.log('Categories API response:', response.data); // Log để kiểm tra
        const categoriesData = Array.isArray(response.data) ? response.data : response.data.categories || [];
        if (!Array.isArray(categoriesData)) {
            console.error('Categories API did not return an array:', categoriesData);
            throw new Error('Categories data is not an array.');
        }
        return categoriesData.map(normalizeCategoryFromApi);
    } catch (error) {
        console.error('API Error - getCategories:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch categories.');
    }
};

const apiCreateBudget = async (axiosInstance, payload) => {
    try {
        const response = await axiosInstance.post('/', payload);
        return normalizeBudgetFromApi(response.data);
    } catch (error) {
        console.error('API Error - createBudget:', error.response?.data || error.message);
        throw error;
    }
};

const apiUpdateBudget = async (axiosInstance, id, payload) => {
    try {
        const response = await axiosInstance.put(`/${id}`, payload);
        return response.data ? normalizeBudgetFromApi(response.data) : null;
    } catch (error) {
        console.error('API Error - updateBudget:', error.response?.data || error.message);
        throw error;
    }
};

const apiDeleteBudget = async (axiosInstance, id) => {
    try {
        await axiosInstance.delete(`/${id}`);
    } catch (error) {
        console.error('API Error - deleteBudget:', error.response?.data || error.message);
        throw error;
    }
};

// --- Budget Form Modal Component ---
const BudgetFormModal = ({ onClose, onSubmit, budgetToEdit, categories }) => {
    const initialFormState = {
        budgetName: '',
        budgetAmount: '',
        budgetPeriod: 'Monthly',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        alertThreshold: '',
        categoryId: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const safeCategories = Array.isArray(categories) ? categories : [];

    useEffect(() => {
        if (budgetToEdit) {
            setFormData({
                budgetName: budgetToEdit.budgetName || '',
                budgetAmount: budgetToEdit.budgetAmount !== undefined ? String(Math.abs(budgetToEdit.budgetAmount)) : '',
                budgetPeriod: ['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(budgetToEdit.budgetPeriod) ? budgetToEdit.budgetPeriod : 'Monthly',
                startDate: budgetToEdit.startDate || initialFormState.startDate,
                endDate: budgetToEdit.endDate || budgetToEdit.startDate || initialFormState.endDate,
                alertThreshold: budgetToEdit.alertThreshold !== undefined ? String(Math.abs(budgetToEdit.alertThreshold)) : '',
                categoryId: budgetToEdit.categoryId || (safeCategories.length > 0 ? safeCategories[0].id : ''),
            });
        } else {
            setFormData({
                ...initialFormState,
                categoryId: safeCategories.length > 0 ? safeCategories[0].id : '',
            });
        }
        setFormError('');
    }, [budgetToEdit, safeCategories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.budgetName.trim()) {
            setFormError('Budget name cannot be empty.');
            return;
        }
        const amountValue = parseFloat(formData.budgetAmount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setFormError('Budget amount must be a positive number.');
            return;
        }
        const thresholdValue = parseFloat(formData.alertThreshold);
        if (isNaN(thresholdValue) || thresholdValue < 0) {
            setFormError('Alert threshold must be a non-negative number.');
            return;
        }
        if (!formData.startDate) {
            setFormError('Please select a start date.');
            return;
        }
        if (!formData.endDate) {
            setFormError('Please select an end date.');
            return;
        }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setFormError('End date cannot be before start date.');
            return;
        }
        if (!formData.categoryId) {
            setFormError('Please select a category.');
            return;
        }
        const budgetData = {
            ...formData,
            id: budgetToEdit ? budgetToEdit.id : uuidv4(),
            budgetAmount: amountValue,
            alertThreshold: thresholdValue,
        };
        try {
            await onSubmit(budgetData);
            onClose();
        } catch (err) {
            setFormError(err.message || 'Error submitting form.');
        }
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1040,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    const modalContentStyle = {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        zIndex: 1050,
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
    };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalContentStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">{budgetToEdit ? 'Edit Budget' : 'Add New Budget'}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="budget-name" className="form-label fw-bold">Budget Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="budget-name"
                            name="budgetName"
                            value={formData.budgetName}
                            onChange={handleChange}
                            required
                            placeholder="E.g., Monthly Food Budget"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="budget-amount" className="form-label fw-bold">Budget Amount <span className="text-danger">*</span></label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="budget-amount"
                            name="budgetAmount"
                            value={formData.budgetAmount}
                            onChange={handleChange}
                            required
                            placeholder="0.00"
                        />
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="budget-period" className="form-label fw-bold">Budget Period</label>
                            <select
                                className="form-select"
                                id="budget-period"
                                name="budgetPeriod"
                                value={formData.budgetPeriod}
                                onChange={handleChange}
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="budget-categoryId" className="form-label fw-bold">Category <span className="text-danger">*</span></label>
                            <select
                                className="form-select"
                                id="budget-categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                disabled={safeCategories.length === 0}
                            >
                                <option value="" disabled>
                                    {safeCategories.length === 0 ? 'No categories available' : '--- Select category ---'}
                                </option>
                                {safeCategories.map(cat => (
                                    <option key={cat.id} value={cat.id} style={{ color: cat.color }}>{cat.name}</option>
                                ))}
                            </select>
                            {safeCategories.length === 0 && <small className="text-muted d-block mt-1">Please create categories first.</small>}
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="budget-startDate" className="form-label fw-bold">Start Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control"
                                id="budget-startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="budget-endDate" className="form-label fw-bold">End Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control"
                                id="budget-endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="budget-alertThreshold" className="form-label fw-bold">Alert Threshold (Optional)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            id="budget-alertThreshold"
                            name="alertThreshold"
                            value={formData.alertThreshold}
                            onChange={handleChange}
                            placeholder="0.00"
                        />
                        <small className="text-muted">Notify when spending reaches this amount.</small>
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{budgetToEdit ? 'Save Changes' : 'Add Budget'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- BudgetManagement Component (Main Page Component) ---
const BudgetManagement = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [budgetToEdit, setBudgetToEdit] = useState(null);
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const axiosInstanceBudgets = useMemo(() => createAxiosInstance(API_BASE_URL_BUDGETS), []);
    const axiosInstanceCategories = useMemo(() => createAxiosInstance(API_BASE_URL_CATEGORIES), []);

    const handleApiError = useCallback((error, context = 'operation') => {
        let message = `Error during ${context}.`;
        if (error.response) {
            if (error.response.status === 401) {
                message = 'Session expired or invalid token. Please log in again.';
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');
                setTimeout(() => {
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }, 2500);
            } else if (error.response.data) {
                if (typeof error.response.data === 'string' && error.response.data.length < 200) message = error.response.data;
                else if (error.response.data.message) message = error.response.data.message;
                else if (error.response.data.title) message = error.response.data.title;
                else if (error.response.data.error) message = error.response.data.error;
                else if (error.response.data.errors) {
                    const errors = error.response.data.errors;
                    const firstErrorField = Object.keys(errors)[0];
                    if (firstErrorField && errors[firstErrorField] && errors[firstErrorField].length > 0) {
                        message = `${firstErrorField}: ${errors[firstErrorField][0]}`;
                    } else {
                        message = `Validation error in ${firstErrorField}.`;
                    }
                } else {
                    message = `Server error (${error.response.status}) during ${context}.`;
                }
            }
        } else if (error.request) {
            message = `Network error during ${context}. Please check your connection or ensure the server is running.`;
        } else {
            message = error.message || `Unknown error during ${context}.`;
        }
        setPageError(message);
        console.error(`API Error (${context}):`, error);
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setPageError('');
        try {
            const token = getAuthToken();
            const budgetsPromise = apiGetBudgets(axiosInstanceBudgets).catch(err => {
                console.error('Failed to fetch budgets:', err);
                return [];
            });
            const categoriesPromise = apiGetCategories(axiosInstanceCategories).catch(err => {
                console.error('Failed to fetch categories:', err);
                return [];
            });
            const [budgets, categories] = await Promise.all([budgetsPromise, categoriesPromise]);
            setBudgets(budgets);
            setCategories(categories);
            if (budgets.length === 0 && categories.length === 0) {
                setPageError('Failed to load data from server. Please try again.');
            }
        } catch (error) {
            handleApiError(error, 'fetching data');
        } finally {
            setIsLoading(false);
        }
    }, [axiosInstanceBudgets, axiosInstanceCategories, handleApiError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenAddBudgetModal = () => {
        if (categories.length === 0) {
            setPageError('Please create at least one category before adding a budget.');
            return;
        }
        setBudgetToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditBudgetModal = (budget) => {
        setBudgetToEdit(budget);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBudgetToEdit(null);
    };

    const handleSubmitBudget = async (budgetData) => {
        setIsLoading(true);
        setPageError('');
        try {
            const categoryId = budgetData.categoryId ? parseInt(budgetData.categoryId, 10) : null;
            if (!categoryId || isNaN(categoryId)) {
                throw new Error('Invalid category ID.');
            }
            const payload = {
                budgetName: budgetData.budgetName,
                budgetAmount: parseFloat(budgetData.budgetAmount),
                budgetPeriod: budgetData.budgetPeriod,
                startDate: new Date(budgetData.startDate).toISOString(),
                endDate: new Date(budgetData.endDate).toISOString(),
                alertThreshold: parseFloat(budgetData.alertThreshold) || 0,
                categoryId,
            };
            if (budgetToEdit) {
                await apiUpdateBudget(axiosInstanceBudgets, budgetData.id, payload);
                alert('Budget updated successfully!');
            } else {
                await apiCreateBudget(axiosInstanceBudgets, payload);
                alert('Budget added successfully!');
            }
            await fetchData();
            handleCloseModal();
        } catch (error) {
            handleApiError(error, 'saving budget');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (window.confirm('Are you sure you want to delete this budget?')) {
            setIsLoading(true);
            setPageError('');
            try {
                await apiDeleteBudget(axiosInstanceBudgets, budgetId);
                alert('Budget deleted successfully!');
                await fetchData();
            } catch (error) {
                handleApiError(error, 'deleting budget');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Unknown';
    };

    const getCategoryColor = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.color : '#6c757d';
    };

    const filteredBudgets = budgets.filter(budget => {
        if (filterPeriod && budget.budgetPeriod !== filterPeriod) return false;
        if (filterCategory && budget.categoryId !== filterCategory) return false;
        return true;
    });

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Budget Management</h1>
                <button className="btn btn-primary" onClick={handleOpenAddBudgetModal} disabled={categories.length === 0}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Add Budget
                </button>
            </div>

            {isLoading && <div className="alert alert-info text-center">Loading data...</div>}
            {pageError && !isLoading && <div className="alert alert-danger text-center">{pageError}</div>}

            {!isLoading && !pageError && (budgets.length > 0 || filterPeriod || filterCategory) && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title mb-3">Filters</h5>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label htmlFor="filterPeriod" className="form-label form-label-sm">Budget Period</label>
                                <select
                                    id="filterPeriod"
                                    className="form-select form-select-sm"
                                    value={filterPeriod}
                                    onChange={e => setFilterPeriod(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="filterCategory" className="form-label form-label-sm">Category</label>
                                <select
                                    id="filterCategory"
                                    className="form-select form-select-sm"
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
                            <div className="col-md-4 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        setFilterPeriod('');
                                        setFilterCategory('');
                                    }}
                                >
                                    <i className="bi bi-x-lg me-1"></i>Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !pageError && (
                budgets.length === 0 && !filterPeriod && !filterCategory ? (
                    <div className="text-center p-5 border rounded bg-light">
                        <i className="bi bi-wallet2" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                        <p className="mt-3 mb-2 text-muted">No budgets have been set yet.</p>
                        {categories.length === 0 && (
                            <p className="text-warning small">Please create categories first to add budgets.</p>
                        )}
                    </div>
                ) : filteredBudgets.length === 0 && budgets.length > 0 ? (
                    <div className="alert alert-warning text-center">No budgets match the selected filters.</div>
                ) : filteredBudgets.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Budget Name</th>
                                    <th scope="col">Category</th>
                                    <th scope="col">Amount</th>
                                    <th scope="col">Period</th>
                                    <th scope="col">Start Date</th>
                                    <th scope="col">End Date</th>
                                    <th scope="col">Alert Threshold</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBudgets.map(budget => (
                                    <tr key={budget.id}>
                                        <td>{budget.budgetName}</td>
                                        <td>
                                            <span className="badge" style={{ backgroundColor: getCategoryColor(budget.categoryId), color: '#fff', fontSize: '0.8em' }}>
                                                {getCategoryName(budget.categoryId)}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(budget.budgetAmount)}</td>
                                        <td>{budget.budgetPeriod}</td>
                                        <td>{new Date(budget.startDate).toLocaleDateString('en-GB')}</td>
                                        <td>{new Date(budget.endDate).toLocaleDateString('en-GB')}</td>
                                        <td>{formatCurrency(budget.alertThreshold)}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-secondary me-1 py-0 px-1"
                                                onClick={() => handleOpenEditBudgetModal(budget)}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                                onClick={() => handleDeleteBudget(budget.id)}
                                                title="Delete"
                                            >
                                                <i className="bi bi-trash3-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null
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