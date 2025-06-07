import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
// import { ToastContainer, toast } from 'react-toastify'; // Uncomment if using toast
// import 'react-toastify/dist/ReactToastify.css';

// --- API Configuration ---
const API_BASE_URL_TRANSACTIONS = 'https://localhost:7166/api/Transactions';
const API_BASE_URL_CATEGORIES = 'https://localhost:7166/api/Categories';
const API_BASE_URL_ACCOUNTS = 'https://localhost:7166/api/Accounts';

const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn("Auth token not found in localStorage. API requests might fail.");
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
    }
    return axios.create({
        baseURL: baseURL,
        headers: headers,
    });
};

// --- Normalization Functions ---
const normalizeTransactionFromApi = (apiTransaction) => {
    return {
        id: apiTransaction.id,
        description: apiTransaction.description,
        amount: Math.abs(apiTransaction.amount),
        type: apiTransaction.transactionType === 0 ? 'income' : 'expense',
        date: apiTransaction.transactionDate,
        categoryId: apiTransaction.categoryId,
        accountId: apiTransaction.accountId,
        notes: apiTransaction.notes,
        currency: apiTransaction.currency || 'VND',
        merchant: apiTransaction.merchant || '',
        tags: apiTransaction.tags || '',
        isRecurring: apiTransaction.isRecurring || false,
        recurringFrequency: apiTransaction.recurringFrequency || '',
    };
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

const normalizeAccountFromApi = (apiAccount) => {
    return {
        id: apiAccount.id,
        accountName: apiAccount.accountName,
        accountType: apiAccount.accountType,
        initialBalance: apiAccount.initialBalance,
        currency: apiAccount.currency,
        bankName: apiAccount.bankName,
        accountNumber: apiAccount.accountNumber,
        icon: apiAccount.icon || (apiAccount.accountType === 'bank' ? 'bi-bank2' : 'bi-wallet2'),
    };
};

// --- Helper Function ---
const formatCurrency = (amount, currency = "VND") => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
};

// --- API Call Functions ---
const apiGetTransactions = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('');
        return Array.isArray(response.data) ? response.data.map(normalizeTransactionFromApi) : [];
    } catch (error) {
        console.error("API Error - getTransactions:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch transactions.');
    }
};

const apiGetCategories = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/'); // Fixed endpoint to root
        const categoriesData = response.data.categories || response.data;
        if (!Array.isArray(categoriesData)) {
            console.error("Categories API did not return an array:", categoriesData);
            throw new Error('Categories data is not an array.');
        }
        return categoriesData.map(normalizeCategoryFromApi);
    } catch (error) {
        console.error("API Error - getCategories:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch categories.');
    }
};

const apiGetAccounts = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/');
        const accountsData = response.data;
        if (!Array.isArray(accountsData)) {
            console.error("Accounts API did not return an array:", accountsData);
            throw new Error('Accounts data is not an array.');
        }
        return accountsData.map(normalizeAccountFromApi);
    } catch (error) {
        console.error("API Error - getAccounts:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch accounts.');
    }
};

const apiCreateTransaction = async (axiosInstance, payload) => {
    const response = await axiosInstance.post('', payload);
    return normalizeTransactionFromApi(response.data);
};

const apiUpdateTransaction = async (axiosInstance, id, payload) => {
    const response = await axiosInstance.put(`/${id}`, payload);
    return response.data ? normalizeTransactionFromApi(response.data) : null;
};

const apiDeleteTransaction = async (axiosInstance, id) => {
    await axiosInstance.delete(`/${id}`);
};

const apiTransferFunds = async (axiosInstance, transferData) => {
    const payload = {
        fromAccountId: parseInt(transferData.fromAccountId, 10),
        toAccountId: parseInt(transferData.toAccountId, 10),
        amount: parseFloat(transferData.amount),
        description: transferData.description || `Transfer from ${transferData.fromAccountName} to ${transferData.toAccountName}`,
        date: new Date(transferData.date).toISOString(),
    };
    const response = await axiosInstance.post('/transfer', payload);
    return response.data;
};

// --- Transaction Form Modal Component ---
const TransactionFormModal = ({ onClose, onSubmit, transactionToEdit, categories, accounts }) => {
    const initialFormState = {
        description: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().slice(0, 10),
        categoryId: '',
        accountId: '',
        notes: '',
        merchant: '',
        tags: '',
        isRecurring: false,
        recurringFrequency: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const filteredCategories = safeCategories.filter(cat => cat.type === formData.type);

    useEffect(() => {
        if (transactionToEdit) {
            setFormData({
                description: transactionToEdit.description || '',
                amount: transactionToEdit.amount !== undefined ? String(Math.abs(transactionToEdit.amount)) : '',
                type: transactionToEdit.type || 'expense',
                date: transactionToEdit.date ? new Date(transactionToEdit.date).toISOString().slice(0, 10) : initialFormState.date,
                categoryId: transactionToEdit.categoryId || '',
                accountId: transactionToEdit.accountId || '',
                notes: transactionToEdit.notes || '',
                merchant: transactionToEdit.merchant || '',
                tags: transactionToEdit.tags || '',
                isRecurring: transactionToEdit.isRecurring || false,
                recurringFrequency: transactionToEdit.recurringFrequency || '',
            });
        } else {
            const defaultType = 'expense';
            const categoriesForDefaultType = safeCategories.filter(c => c.type === defaultType);
            const defaultCategoryId = categoriesForDefaultType.length > 0 ? categoriesForDefaultType[0].id : (safeCategories.length > 0 ? safeCategories[0].id : '');
            const defaultAccountId = safeAccounts.length > 0 ? safeAccounts[0].id : '';
            setFormData({
                ...initialFormState,
                type: defaultType,
                categoryId: defaultCategoryId,
                accountId: defaultAccountId,
            });
        }
        setFormError('');
    }, [transactionToEdit, safeCategories, safeAccounts]);

    useEffect(() => {
        if (!transactionToEdit || (transactionToEdit && formData.type !== transactionToEdit.type)) {
            const currentCategoryIsStillValid = filteredCategories.some(cat => cat.id === formData.categoryId);
            if (!currentCategoryIsStillValid && filteredCategories.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: filteredCategories[0].id }));
            } else if (formData.categoryId === '' && filteredCategories.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: filteredCategories[0].id }));
            }
        }
    }, [formData.type, filteredCategories, transactionToEdit, formData.categoryId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.description.trim()) {
            setFormError('Description cannot be empty.');
            return;
        }
        const amountValue = parseFloat(formData.amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setFormError('Amount must be a positive number.');
            return;
        }
        if (!formData.categoryId) {
            setFormError('Please select a category.');
            return;
        }
        if (!formData.accountId) {
            setFormError('Please select an account.');
            return;
        }
        if (!formData.date) {
            setFormError('Please select a transaction date.');
            return;
        }
        const transactionData = {
            ...formData,
            id: transactionToEdit ? transactionToEdit.id : uuidv4(),
            amount: amountValue,
            date: new Date(formData.date).toISOString(),
        };
        try {
            await onSubmit(transactionData);
        } catch (err) {
            setFormError(err.message || "Error submitting form.");
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
                    <h2 className="h4 mb-0">{transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="trans-description" className="form-label fw-bold">Description <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="trans-description" name="description" value={formData.description} onChange={handleChange} required placeholder="E.g., Dinner with friends" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="trans-merchant" className="form-label fw-bold">Merchant (Optional)</label>
                        <input type="text" className="form-control" id="trans-merchant" name="merchant" value={formData.merchant} onChange={handleChange} placeholder="E.g., Restaurant XYZ" />
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="trans-amount" className="form-label fw-bold">Amount <span className="text-danger">*</span></label>
                            <input type="number" step="any" className="form-control" id="trans-amount" name="amount" value={formData.amount} onChange={handleChange} required placeholder="0" />
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="trans-type" className="form-label fw-bold">Transaction Type</label>
                            <select className="form-select" id="trans-type" name="type" value={formData.type} onChange={handleChange}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="trans-categoryId" className="form-label fw-bold">Category <span className="text-danger">*</span></label>
                            <select className="form-select" id="trans-categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required disabled={filteredCategories.length === 0}>
                                <option value="" disabled>
                                    {safeCategories.length === 0 ? 'No categories available' :
                                    filteredCategories.length === 0 ? `No categories for ${formData.type}` :
                                    '--- Select category ---'}
                                </option>
                                {filteredCategories.map(cat => (
                                    <option key={cat.id} value={cat.id} style={{ color: cat.color }}>{cat.name}</option>
                                ))}
                            </select>
                            {safeCategories.length === 0 && <small className="text-muted d-block mt-1">Please create categories first.</small>}
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="trans-accountId" className="form-label fw-bold">Account <span className="text-danger">*</span></label>
                            <select className="form-select" id="trans-accountId" name="accountId" value={formData.accountId} onChange={handleChange} required disabled={safeAccounts.length === 0}>
                                <option value="" disabled>
                                    {safeAccounts.length === 0 ? 'No accounts available' : '--- Select account ---'}
                                </option>
                                {safeAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.accountName} ({formatCurrency(acc.initialBalance, acc.currency)})</option>
                                ))}
                            </select>
                            {safeAccounts.length === 0 && <small className="text-muted d-block mt-1">Please create an account first.</small>}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="trans-date" className="form-label fw-bold">Transaction Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="trans-date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="trans-tags" className="form-label fw-bold">Tags (Optional)</label>
                        <input type="text" className="form-control" id="trans-tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="E.g., food, urgent" />
                    </div>
                    <div className="mb-3 form-check">
                        <input type="checkbox" className="form-check-input" id="trans-isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} />
                        <label htmlFor="trans-isRecurring" className="form-check-label">Is Recurring?</label>
                    </div>
                    {formData.isRecurring && (
                        <div className="mb-3">
                            <label htmlFor="trans-recurringFrequency" className="form-label fw-bold">Recurring Frequency</label>
                            <select className="form-select" id="trans-recurringFrequency" name="recurringFrequency" value={formData.recurringFrequency} onChange={handleChange}>
                                <option value="">--- Select frequency ---</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}
                    <div className="mb-3">
                        <label htmlFor="trans-notes" className="form-label fw-bold">Notes (Optional)</label>
                        <textarea className="form-control" id="trans-notes" name="notes" rows="2" value={formData.notes} onChange={handleChange} placeholder="Additional notes..."></textarea>
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{transactionToEdit ? 'Save Changes' : 'Add Transaction'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Transfer Form Modal Component ---
const TransferFormModal = ({ isOpen, onClose, onSubmit, accounts }) => {
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const initialFormState = {
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const defaultFromAccount = safeAccounts.length > 0 ? safeAccounts[0].id : '';
            const defaultToAccount = safeAccounts.length > 1 && safeAccounts[0].id === defaultFromAccount ? safeAccounts[1].id : (safeAccounts.length > 0 && safeAccounts[0].id !== defaultFromAccount ? safeAccounts[0].id : '');
            setFormData({
                ...initialFormState,
                fromAccountId: defaultFromAccount,
                toAccountId: defaultToAccount,
            });
            setFormError('');
        }
    }, [isOpen, safeAccounts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.fromAccountId) {
            setFormError('Please select a source account.');
            return;
        }
        if (!formData.toAccountId) {
            setFormError('Please select a destination account.');
            return;
        }
        if (formData.fromAccountId === formData.toAccountId) {
            setFormError('Source and destination accounts must be different.');
            return;
        }
        const amountValue = parseFloat(formData.amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setFormError('Amount must be a positive number.');
            return;
        }
        if (!formData.date) {
            setFormError('Please select a transfer date.');
            return;
        }
        const transferData = {
            ...formData,
            amount: amountValue,
            fromAccountName: safeAccounts.find(acc => acc.id === formData.fromAccountId)?.accountName || '',
            toAccountName: safeAccounts.find(acc => acc.id === formData.toAccountId)?.accountName || '',
        };
        try {
            await onSubmit(transferData);
        } catch (err) {
            setFormError(err.message || "Error submitting transfer.");
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
                    <h2 className="h4 mb-0">Transfer Funds</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="transfer-fromAccountId" className="form-label fw-bold">From Account <span className="text-danger">*</span></label>
                            <select className="form-select" id="transfer-fromAccountId" name="fromAccountId" value={formData.fromAccountId} onChange={handleChange} required disabled={safeAccounts.length < 2}>
                                <option value="" disabled>{safeAccounts.length < 2 ? 'Need at least 2 accounts' : '--- Select Source Account ---'}</option>
                                {safeAccounts.map(acc => (
                                    <option key={`from-${acc.id}`} value={acc.id}>{acc.accountName} ({formatCurrency(acc.initialBalance, acc.currency)})</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="transfer-toAccountId" className="form-label fw-bold">To Account <span className="text-danger">*</span></label>
                            <select className="form-select" id="transfer-toAccountId" name="toAccountId" value={formData.toAccountId} onChange={handleChange} required disabled={safeAccounts.length < 2}>
                                <option value="" disabled>{safeAccounts.length < 2 ? 'Need at least 2 accounts' : '--- Select Destination Account ---'}</option>
                                {safeAccounts.filter(acc => acc.id !== formData.fromAccountId).map(acc => (
                                    <option key={`to-${acc.id}`} value={acc.id}>{acc.accountName} ({formatCurrency(acc.initialBalance, acc.currency)})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="transfer-amount" className="form-label fw-bold">Amount <span className="text-danger">*</span></label>
                        <input type="number" step="any" className="form-control" id="transfer-amount" name="amount" value={formData.amount} onChange={handleChange} required placeholder="0" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="transfer-date" className="form-label fw-bold">Transfer Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="transfer-date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="transfer-description" className="form-label fw-bold">Description (Optional)</label>
                        <textarea className="form-control" id="transfer-description" name="description" rows="2" value={formData.description} onChange={handleChange} placeholder="E.g., Monthly savings transfer"></textarea>
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-success">Transfer Funds</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- TransactionManagement Component (Main Page Component) ---
const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');

    const axiosInstanceTransactions = useMemo(() => createAxiosInstance(API_BASE_URL_TRANSACTIONS), []);
    const axiosInstanceCategories = useMemo(() => createAxiosInstance(API_BASE_URL_CATEGORIES), []);
    const axiosInstanceAccounts = useMemo(() => createAxiosInstance(API_BASE_URL_ACCOUNTS), []);

    const handleApiError = useCallback((error, context = "operation") => {
        let message = `Error during ${context}.`;
        if (error.response) {
            if (error.response.status === 401) {
                message = 'Session expired or invalid. Redirecting to login...';
                localStorage.removeItem('authToken');
                setTimeout(() => { window.location.href = '/login'; }, 2500);
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
            message = `Network error during ${context}. Please check your connection.`;
        } else {
            message = error.message || `Unknown error during ${context}.`;
        }
        setPageError(message);
        console.error(`API Error (${context}):`, error);
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setPageError('');
        const token = getAuthToken();
        if (!token) {
            setPageError("Authentication required. Please log in.");
            setIsLoading(false);
            setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 2000);
            return;
        }
        try {
            const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
                apiGetTransactions(axiosInstanceTransactions),
                apiGetCategories(axiosInstanceCategories),
                apiGetAccounts(axiosInstanceAccounts),
            ]);
            setTransactions(transactionsRes);
            setCategories(categoriesRes);
            setAccounts(accountsRes);
        } catch (error) {
            if (!pageError && error.message) {
                handleApiError(error, 'fetching initial data');
            }
        } finally {
            setIsLoading(false);
        }
    }, [axiosInstanceTransactions, axiosInstanceCategories, axiosInstanceAccounts, handleApiError, pageError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenAddTransactionModal = () => {
        if (!Array.isArray(categories) || categories.length === 0 || !Array.isArray(accounts) || accounts.length === 0) {
            setPageError('Please ensure categories and accounts are loaded and available before adding a transaction.');
            return;
        }
        setTransactionToEdit(null);
        setIsTransactionModalOpen(true);
    };

    const handleOpenEditTransactionModal = (transaction) => {
        setTransactionToEdit(transaction);
        setIsTransactionModalOpen(true);
    };

    const handleCloseTransactionModal = () => {
        setIsTransactionModalOpen(false);
        setTransactionToEdit(null);
    };

    const handleSubmitTransaction = async (transactionData) => {
        setIsLoading(true);
        setPageError('');
        try {
            const payload = {
                accountId: parseInt(transactionData.accountId, 10),
                categoryId: parseInt(transactionData.categoryId, 10),
                amount: parseFloat(transactionData.amount),
                transactionType: transactionData.type === 'income' ? '0' : '1', // String as per your required format
                transactionDate: transactionData.date,
                description: transactionData.description,
                merchant: transactionData.merchant || '',
                tags: transactionData.tags || '',
                isRecurring: transactionData.isRecurring || false,
                recurringFrequency: transactionData.isRecurring ? transactionData.recurringFrequency || '' : '',
            };
            if (transactionToEdit) {
                await apiUpdateTransaction(axiosInstanceTransactions, transactionData.id, { id: transactionData.id, ...payload });
                alert('Transaction updated successfully!');
            } else {
                await apiCreateTransaction(axiosInstanceTransactions, payload);
                alert('Transaction added successfully!');
            }
            await fetchData();
            handleCloseTransactionModal();
        } catch (error) {
            handleApiError(error, 'saving transaction');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            setIsLoading(true);
            setPageError('');
            try {
                await apiDeleteTransaction(axiosInstanceTransactions, transactionId);
                alert('Transaction deleted successfully!');
                await fetchData();
            } catch (error) {
                handleApiError(error, 'deleting transaction');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenTransferModal = () => {
        if (!Array.isArray(accounts) || accounts.length < 2) {
            setPageError("You need at least two accounts to make a transfer.");
            return;
        }
        setIsTransferModalOpen(true);
    };

    const handleCloseTransferModal = () => {
        setIsTransferModalOpen(false);
    };

    const handleSubmitTransfer = async (transferData) => {
        setIsLoading(true);
        setPageError('');
        try {
            await apiTransferFunds(axiosInstanceTransactions, transferData);
            alert('Funds transferred successfully!');
            await fetchData();
            handleCloseTransferModal();
        } catch (error) {
            handleApiError(error, 'transferring funds');
            throw error;
        } finally {
            setIsLoading(false);
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

    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.accountName : 'Unknown';
    };

    const filteredAndSortedTransactions = transactions
        .filter(t => {
            if (filterType && t.type !== filterType) return false;
            if (filterCategory && t.categoryId !== filterCategory) return false;
            if (filterAccount && t.accountId !== filterAccount) return false;
            if (filterDateStart && new Date(t.date) < new Date(filterDateStart)) return false;
            if (filterDateEnd && new Date(t.date) > new Date(filterDateEnd)) return false;
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="container mt-4">
            {/* <ToastContainer position="top-right" autoClose={3000} /> */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Transaction Management</h1>
                <div>
                    <button className="btn btn-success me-2" onClick={handleOpenTransferModal} disabled={!Array.isArray(accounts) || accounts.length < 2}>
                        <i className="bi bi-arrow-left-right me-2"></i>Transfer Funds
                    </button>
                    <button className="btn btn-primary" onClick={handleOpenAddTransactionModal} disabled={!Array.isArray(categories) || categories.length === 0 || !Array.isArray(accounts) || accounts.length === 0}>
                        <i className="bi bi-plus-circle-fill me-2"></i>Add Transaction
                    </button>
                </div>
            </div>

            {isLoading && <div className="alert alert-info text-center">Loading data...</div>}
            {pageError && !isLoading && <div className="alert alert-danger text-center">{pageError}</div>}

            {!isLoading && !pageError && (transactions.length > 0 || filterType || filterCategory || filterAccount || filterDateStart || filterDateEnd) && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title mb-3">Filters & Sorting</h5>
                        <div className="row g-3">
                            <div className="col-md-3">
                                <label htmlFor="filterType" className="form-label form-label-sm">Type</label>
                                <select id="filterType" className="form-select form-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="filterCategory" className="form-label form-label-sm">Category</label>
                                <select id="filterCategory" className="form-select form-select-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} disabled={!Array.isArray(categories) || categories.length === 0}>
                                    <option value="">All</option>
                                    {Array.isArray(categories) && categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="filterAccount" className="form-label form-label-sm">Account</label>
                                <select id="filterAccount" className="form-select form-select-sm" value={filterAccount} onChange={e => setFilterAccount(e.target.value)} disabled={!Array.isArray(accounts) || accounts.length === 0}>
                                    <option value="">All</option>
                                    {Array.isArray(accounts) && accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.accountName}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="sortOrder" className="form-label form-label-sm">Sort by Date</label>
                                <select id="sortOrder" className="form-select form-select-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                                    <option value="desc">Newest First</option>
                                    <option value="asc">Oldest First</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="filterDateStart" className="form-label form-label-sm">From Date</label>
                                <input type="date" id="filterDateStart" className="form-control form-control-sm" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="filterDateEnd" className="form-label form-label-sm">To Date</label>
                                <input type="date" id="filterDateEnd" className="form-control form-control-sm" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                            </div>
                            <div className="col-md-6 d-flex align-items-end">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                                    setFilterType('');
                                    setFilterCategory('');
                                    setFilterAccount('');
                                    setFilterDateStart('');
                                    setFilterDateEnd('');
                                    setSortOrder('desc');
                                }}>
                                    <i className="bi bi-x-lg me-1"></i> Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !pageError && (
                transactions.length === 0 && !filterType && !filterCategory && !filterAccount && !filterDateStart && !filterDateEnd ? (
                    <div className="text-center p-5 border rounded bg-light">
                        <i className="bi bi-journal-text" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                        <p className="mt-3 mb-2 text-muted">No transactions have been recorded yet.</p>
                        {(!Array.isArray(categories) || categories.length === 0 || !Array.isArray(accounts) || accounts.length === 0) &&
                            <p className="text-warning small">Please create categories and accounts first to add transactions.</p>
                        }
                    </div>
                ) : filteredAndSortedTransactions.length === 0 && transactions.length > 0 ? (
                    <div className="alert alert-warning text-center">No transactions match the selected filters.</div>
                ) : filteredAndSortedTransactions.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Date</th>
                                    <th scope="col">Description</th>
                                    <th scope="col" className="text-center">Category</th>
                                    <th scope="col">Account</th>
                                    <th scope="col" className="text-end">Amount</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedTransactions.map(t => (
                                    <tr key={t.id}>
                                        <td>{new Date(t.date).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            {t.description}
                                            {t.notes && <div className="text-muted small fst-italic">{t.notes}</div>}
                                        </td>
                                        <td className="text-center">
                                            <span className="badge" style={{ backgroundColor: getCategoryColor(t.categoryId), color: '#fff', fontSize: '0.8em' }}>
                                                {getCategoryName(t.categoryId)}
                                            </span>
                                        </td>
                                        <td>{getAccountName(t.accountId)}</td>
                                        <td className={`text-end fw-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                            {t.type === 'expense' ? '-' : '+'}
                                            {formatCurrency(t.amount, t.currency || 'VND')}
                                        </td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-outline-secondary me-1 py-0 px-1" onClick={() => handleOpenEditTransactionModal(t)} title="Edit">
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteTransaction(t.id)} title="Delete">
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

            {isTransactionModalOpen && (
                <TransactionFormModal
                    onClose={handleCloseTransactionModal}
                    onSubmit={handleSubmitTransaction}
                    transactionToEdit={transactionToEdit}
                    categories={categories}
                    accounts={accounts}
                />
            )}
            {isTransferModalOpen && (
                <TransferFormModal
                    isOpen={isTransferModalOpen}
                    onClose={handleCloseTransferModal}
                    onSubmit={handleSubmitTransfer}
                    accounts={accounts}
                />
            )}
        </div>
    );
};

export default TransactionManagement;