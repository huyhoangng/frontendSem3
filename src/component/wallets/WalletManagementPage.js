import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAccounts, createAccount, updateAccount, deleteAccount, formatCurrency } from '../service/accountService';

// Account Form Modal Component
const AccountFormModal = ({ show, onClose, onSubmit, accountToEdit }) => {
    const initialFormState = {
        name: '',
        type: 'Cash',
        balance: '',
        currency: 'USD',
        bankName: '',
        accountNumber: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currencies = [
        { value: 'USD', label: 'USD' },
        { value: 'VND', label: 'VND' }
    ];

    useEffect(() => {
        if (accountToEdit) {
            setFormData({
                name: accountToEdit.name || '',
                type: accountToEdit.type || 'Cash',
                balance: accountToEdit.balance?.toString() || '',
                currency: accountToEdit.currency || 'USD',
                bankName: accountToEdit.bankName || '',
                accountNumber: accountToEdit.accountNumber || ''
            });
        } else {
            setFormData(initialFormState);
        }
        setError('');
    }, [accountToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'balance' ? value : value.trim()
        }));
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.name.trim()) {
            errors.push('Account name is required');
        }

        const balance = parseFloat(formData.balance);
        if (formData.balance === '') {
            errors.push('Initial balance is required');
        } else if (isNaN(balance)) {
            errors.push('Initial balance must be a valid number');
        } else if (balance <= 0) {
            errors.push('Initial balance must be greater than 0');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const validationErrors = validateForm();
            if (validationErrors.length > 0) {
                setError(validationErrors.join('\n'));
                return;
            }

            const payload = {
                name: formData.name.trim(),
                type: formData.type,
                balance: parseFloat(formData.balance),
                currency: formData.currency,
                bankName: formData.bankName.trim() || null,
                accountNumber: formData.accountNumber.trim() || '123456789'
            };

            console.log('Submitting payload:', payload); // Debug
            await onSubmit(payload);
            onClose();
        } catch (err) {
            console.error('Form submission error:', err);
            setError(err.message || 'Failed to save account. Please check your input and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{accountToEdit ? 'Edit Account' : 'Add New Account'}</h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting}></button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {error.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            )}
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label">Account Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter account name"
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Bank Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        placeholder="Enter bank name (optional)"
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Account Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="Enter account number (optional)"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Initial Balance <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="balance"
                                            value={formData.balance}
                                            onChange={handleChange}
                                            placeholder="Enter initial balance"
                                            step="0.01"
                                            min="0.01"
                                            required
                                        />
                                        <span className="input-group-text">{formData.currency}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Currency</label>
                                    <select
                                        className="form-select"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                    >
                                        {currencies.map(currency => (
                                            <option key={currency.value} value={currency.value}>
                                                {currency.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
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
                                    'Save Account'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Main Component
const WalletManagementPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const handleApiError = useCallback((err, context = "operation") => {
        let message = `An error occurred during ${context}.`;
        if (err.response && err.response.status === 401) {
            message = 'Session expired. Redirecting to login...';
            localStorage.removeItem('authToken');
            toast.error(message);
            setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 3000);
        } else {
            message = err.response?.data?.message || err.response?.data?.title || err.message;
            toast.error(message);
        }
        setError(message);
        console.error(`API Error (${context}):`, err);
    }, []);

    const fetchAccounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            handleApiError(err, "loading accounts");
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleOpenModal = (account = null) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAccountToEdit(null);
    };

    const handleSubmitAccount = async (formData) => {
        try {
            if (accountToEdit && accountToEdit.id) {
                console.log('Updating account:', accountToEdit.id, formData); // Debug
                await updateAccount(accountToEdit.id, formData);
                toast.success('Account updated successfully!');
            } else {
                console.log('Creating new account:', formData); // Debug
                await createAccount(formData);
                toast.success('Account created successfully!');
            }
            await fetchAccounts();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving account:', err);
            let errorMessage = 'Failed to save account. ';
            if (err.message.includes('session has expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else if (err.message.includes('not found')) {
                errorMessage = 'The account you are trying to update no longer exists.';
            } else {
                errorMessage = err.message;
            }
            toast.error(errorMessage);
            throw err;
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                await deleteAccount(accountId);
                toast.success('Account deleted successfully!');
                await fetchAccounts();
            } catch (err) {
                handleApiError(err, 'deleting account');
            }
        }
    };

    const renderAccountCard = (account) => (
        <div key={account.id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h5 className="card-title mb-1">{account.name}</h5>
                            <h6 className="card-subtitle text-muted">
                                {account.type}
                            </h6>
                        </div>
                        <span className={`badge ${account.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="mt-3">
                        <p className="card-text mb-2">
                            <strong>Balance:</strong><br />
                            <span className="h5">
                                {formatCurrency(account.balance, account.currency)}
                            </span>
                        </p>
                        <p className="card-text mb-2">
                            <small className="text-muted">
                                Created: {new Date(account.createdAt).toLocaleDateString()}
                            </small>
                        </p>
                    </div>
                    <div className="mt-3">
                        <button 
                            className="btn btn-sm btn-outline-primary me-2" 
                            onClick={() => handleOpenModal(account)}
                        >
                            <i className="bi bi-pencil-fill me-1"></i> Edit
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteAccount(account.id)}
                        >
                            <i className="bi bi-trash-fill me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">My Accounts</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-circle-fill me-2"></i> Add Account
                </button>
            </div>

            {isLoading && <div className="text-center my-5"><div className="spinner-border"></div></div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {!isLoading && !error && (
                <div className="row g-4">
                    {accounts.length > 0 ? (
                        accounts.map(renderAccountCard)
                    ) : (
                        <div className="col-12">
                            <div className="text-center py-5">
                                <i className="bi bi-wallet2 display-1 text-muted mb-3"></i>
                                <p className="text-muted">No accounts found. Add your first account to get started!</p>
                                <button 
                                    className="btn btn-primary mt-2" 
                                    onClick={() => handleOpenModal()}
                                >
                                    <i className="bi bi-plus-circle-fill me-2"></i> Add Your First Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AccountFormModal
                show={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitAccount}
                accountToEdit={accountToEdit}
            />
        </div>
    );
};

export default WalletManagementPage;