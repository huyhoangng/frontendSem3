// src/component/transaction/TransactionManagement.js
import React, { useState, useEffect, useCallback } from 'react';

// Sửa lại đường dẫn import cho đúng
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../service/transactionService';
import { getAccounts } from '../service/accountService'; 
import { getCategories } from '../service/categoryService';

// --- Helpers ---
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB');

// --- Component Form Modal ---
const TransactionFormModal = ({ show, onClose, onSubmit, transactionToEdit, accounts = [], categories = [] }) => {
    const initialFormState = {
        accountId: '',
        categoryId: '',
        amount: '',
        transactionType: 'Expense',
        transactionDate: new Date().toISOString().slice(0, 10),
        description: '',
        merchant: '',
        tags: '',
        isRecurring: false,
        recurringFrequency: 'Monthly'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');

    // Log initial state when modal opens
    useEffect(() => {
        console.log('Modal opened with accounts:', accounts);
        console.log('Modal opened with categories:', categories);
        if (transactionToEdit) {
            console.log('Editing transaction:', transactionToEdit);
            setFormData({
                accountId: transactionToEdit.accountId?.toString() || '',
                categoryId: transactionToEdit.categoryId?.toString() || '',
                amount: transactionToEdit.amount?.toString() || '',
                transactionType: transactionToEdit.transactionType || 'Expense',
                transactionDate: transactionToEdit.transactionDate ? new Date(transactionToEdit.transactionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                description: transactionToEdit.description || '',
                merchant: transactionToEdit.merchant || '',
                tags: transactionToEdit.tags || '',
                isRecurring: transactionToEdit.isRecurring || false,
                recurringFrequency: transactionToEdit.recurringFrequency || 'Monthly'
            });
        } else {
            console.log('Setting initial form state');
            setFormData(initialFormState);
        }
    }, [transactionToEdit, accounts, categories]);

    // Add logging for categories and transaction type
    useEffect(() => {
        console.log('Transaction type changed to:', formData.transactionType);
        console.log('Available categories:', categories);
        const filteredCategories = categories.filter(cat => 
            cat.isActive && cat.type === formData.transactionType.toUpperCase()
        );
        console.log('Filtered categories for type:', filteredCategories);
    }, [formData.transactionType, categories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log('Form field changed:', { name, value, type, checked });
        
        const newValue = type === 'checkbox' ? checked : value;
        console.log('New value to be set:', newValue);

        setFormData(prev => {
            const newFormData = {
                ...prev,
                [name]: newValue,
                // Reset category when transaction type changes
                ...(name === 'transactionType' && { categoryId: '' }),
                ...(name === 'isRecurring' && !checked && { recurringFrequency: 'Monthly' })
            };
            console.log('Updated form data:', newFormData);
            return newFormData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        console.log('Current form data before submission:', formData);
        console.log('Available categories:', categories);

        // Validate required fields with detailed logging
        const requiredFields = {
            accountId: formData.accountId,
            categoryId: formData.categoryId,
            amount: formData.amount,
            transactionDate: formData.transactionDate
        };

        console.log('Required fields validation:', requiredFields);

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            console.log('Missing required fields:', missingFields);
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Validate numeric fields
        const amount = parseFloat(formData.amount);
        const accountId = parseInt(formData.accountId, 10);
        const categoryId = parseInt(formData.categoryId, 10);

        console.log('Parsed numeric values:', { amount, accountId, categoryId });
        console.log('Selected category:', categories.find(cat => cat.id === categoryId));

        if (isNaN(amount) || amount <= 0) {
            setError("Amount must be a positive number.");
            return;
        }

        if (isNaN(accountId) || accountId <= 0) {
            setError("Please select a valid account.");
            return;
        }

        const selectedCategory = categories.find(cat => cat.id === categoryId);
        if (!selectedCategory) {
            console.error('Category not found:', { categoryId, availableCategories: categories });
            setError("Please select a valid category.");
            return;
        }

        const payload = {
            accountId: accountId,
            categoryId: categoryId,
            amount: amount,
            transactionType: formData.transactionType,
            transactionDate: new Date(formData.transactionDate).toISOString(),
            description: formData.description || '',
            merchant: formData.merchant || '',
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).join(', ') : '',
            isRecurring: formData.isRecurring || false,
            recurringFrequency: formData.isRecurring ? (formData.recurringFrequency || 'Monthly') : null
        };

        console.log('Final payload to be sent:', payload);

        try {
            await onSubmit(payload, transactionToEdit?.id);
            onClose();
        } catch (err) {
            console.error('Error submitting transaction:', err);
            setError(err.message || 'Failed to save transaction.');
        }
    };

    if (!show) return null;

    const renderAccountOption = (account) => (
        <option key={account.id} value={account.id}>
            {account.name} ({account.type} - {account.bankName}) - {formatCurrency(account.balance)}
        </option>
    );

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error}
                                </div>
                            )}
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="amount" className="form-label">Amount <span className="text-danger">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-control"
                                        id="amount"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="transactionType" className="form-label">Type <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        id="transactionType"
                                        name="transactionType"
                                        value={formData.transactionType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Expense">Expense</option>
                                        <option value="Income">Income</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="accountId" className="form-label">Account <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        id="accountId"
                                        name="accountId"
                                        value={formData.accountId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select an account</option>
                                        {accounts
                                            .filter(acc => acc.isActive)
                                            .map(renderAccountOption)}
                                    </select>
                                    {formData.accountId && (
                                        <small className="text-muted">
                                            Selected account balance: {formatCurrency(
                                                accounts.find(acc => acc.id === parseInt(formData.accountId))?.balance || 0
                                            )}
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="categoryId" className="form-label">Category <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        id="categoryId"
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories
                                            .filter(cat => {
                                                const isActive = cat.isActive;
                                                const matchesType = cat.type === formData.transactionType.toUpperCase();
                                                console.log('Category filter check:', {
                                                    category: cat.name,
                                                    categoryType: cat.type,
                                                    transactionType: formData.transactionType.toUpperCase(),
                                                    isActive,
                                                    matchesType
                                                });
                                                return isActive && matchesType;
                                            })
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name} {cat.description ? `(${cat.description})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                    {formData.categoryId && (
                                        <small className="text-muted">
                                            Selected category: {categories.find(cat => cat.id === parseInt(formData.categoryId))?.name}
                                        </small>
                                    )}
                                    {categories.filter(cat => cat.isActive && cat.type === formData.transactionType.toUpperCase()).length === 0 && (
                                        <small className="text-danger">
                                            No active categories available for {formData.transactionType.toLowerCase()}
                                        </small>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="merchant" className="form-label">Merchant</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="merchant"
                                        name="merchant"
                                        value={formData.merchant}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="transactionDate" className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="transactionDate"
                                        name="transactionDate"
                                        value={formData.transactionDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <div className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isRecurring"
                                            name="isRecurring"
                                            checked={formData.isRecurring}
                                            onChange={handleChange}
                                        />
                                        <label className="form-check-label" htmlFor="isRecurring">
                                            Is Recurring?
                                        </label>
                                    </div>
                                    {formData.isRecurring && (
                                        <div className="mt-2">
                                            <label htmlFor="recurringFrequency" className="form-label">Recurring Frequency</label>
                                            <select
                                                className="form-select"
                                                id="recurringFrequency"
                                                name="recurringFrequency"
                                                value={formData.recurringFrequency}
                                                onChange={handleChange}
                                            >
                                                <option value="Daily">Daily</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Yearly">Yearly</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="col-12">
                                    <label htmlFor="tags" className="form-label">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="tags"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        placeholder="e.g. salary, income"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            <button type="submit" className="btn btn-primary">Save changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Component trang chính ---
const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);

    const handleApiError = useCallback((err, context = 'operation') => {
        if (err.response && err.response.status === 401) {
            setError('Your session has expired. Redirecting to login page...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 3000);
        } else {
            setError(`Error during ${context}: ${err.message || 'An unknown error occurred.'}`);
        }
        console.error(`API Error (${context}):`, err);
    }, []);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [transactionsData, accountsData, categoriesData] = await Promise.all([
                getTransactions(),
                getAccounts(),
                getCategories()
            ]);
            
            // Sort accounts by name for better UX
            const sortedAccounts = [...accountsData].sort((a, b) => a.name.localeCompare(b.name));
            
            setTransactions(transactionsData);
            setAccounts(sortedAccounts);
            setCategories(categoriesData);
        } catch (err) {
            handleApiError(err, 'fetching initial data');
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleOpenModal = (transaction = null) => { setTransactionToEdit(transaction); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setTransactionToEdit(null); };

    const handleSaveTransaction = async (payload, id) => {
        try {
            if (id) { await updateTransaction(id, payload); }
            else { await createTransaction(payload); }
            await fetchAllData();
        } catch (err) {
            throw new Error(err.response?.data?.title || err.message || 'An error occurred.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await deleteTransaction(id);
                await fetchAllData();
            } catch (err) {
                handleApiError(err, 'deleting transaction');
            }
        }
    };

    const renderTransactionRow = (tx) => {
        const account = accounts.find(acc => acc.id === tx.accountId);
        return (
            <tr key={tx.id}>
                <td>{formatDate(tx.transactionDate)}</td>
                <td>
                    <div>{tx.description || '-'}</div>
                    <small className="text-muted">{tx.merchant}</small>
                    {tx.tags && (
                        <div className="mt-1">
                            {tx.tags.split(',').map((tag, index) => (
                                <span key={index} className="badge bg-light text-dark me-1">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </td>
                <td>
                    <div>{account?.name || 'Unknown'}</div>
                    <small className="text-muted">{account?.type} - {account?.bankName}</small>
                </td>
                <td>{tx.categoryName}</td>
                <td className={`text-end fw-bold ${tx.transactionType === 'Income' ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(tx.amount)}
                </td>
                <td className="text-center">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleOpenModal(tx)}>
                        <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tx.id)}>
                        <i className="bi bi-trash3-fill"></i>
                    </button>
                </td>
            </tr>
        );
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="h2">Transactions</h1><button className="btn btn-primary" onClick={() => handleOpenModal()}><i className="bi bi-plus-circle-fill me-2"></i> Add Transaction</button></div>
            {isLoading && <div className="text-center"><div className="spinner-border"></div></div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            {!isLoading && !error && (
                <div className="card shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Account</th>
                                    <th>Category</th>
                                    <th className="text-end">Amount</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map(renderTransactionRow)
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center p-4">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TransactionFormModal show={isModalOpen} onClose={handleCloseModal} onSubmit={handleSaveTransaction} transactionToEdit={transactionToEdit} accounts={accounts} categories={categories} />
        </div>
    );
};

export default TransactionManagement;