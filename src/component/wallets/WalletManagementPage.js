import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper function to format currency
const formatCurrency = (amount, currency = "VND") => {
  if (isNaN(parseFloat(amount))) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Component Modal for adding/editing accounts
const AccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit }) => {
  const initialFormState = {
    accountName: '',
    accountType: 'bank',
    bankName: '',
    accountNumber: '',
    initialBalance: '',
    creditLimit: '',
    currency: 'VND',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  const accountTypes = [
    { value: 'bank', label: 'Bank Account', icon: 'bi-bank2' },
    { value: 'ewallet', label: 'E-Wallet', icon: 'bi-phone' },
    { value: 'cash', label: 'Cash', icon: 'bi-cash-coin' },
    { value: 'savings', label: 'Savings', icon: 'bi-piggy-bank' },
    { value: 'credit_card', label: 'Credit Card', icon: 'bi-credit-card-2-front' },
    { value: 'investment', label: 'Investment', icon: 'bi-graph-up-arrow' },
    { value: 'other', label: 'Other', icon: 'bi-wallet2' },
  ];

  useEffect(() => {
    if (accountToEdit) {
      setFormData({
        accountName: accountToEdit.accountName || '',
        accountType: accountToEdit.accountType || 'bank',
        bankName: accountToEdit.bankName || '',
        accountNumber: accountToEdit.accountNumber || '',
        initialBalance: accountToEdit.initialBalance !== undefined ? String(accountToEdit.initialBalance) : '',
        creditLimit: accountToEdit.creditLimit !== undefined ? String(accountToEdit.creditLimit) : '',
        currency: accountToEdit.currency || 'VND',
      });
    } else {
      setFormData(initialFormState);
    }
    setFormError('');
  }, [accountToEdit, isOpen]);

  useEffect(() => {
    const selectedType = accountTypes.find(t => t.value === formData.accountType);
    if (selectedType && formData.accountType !== (accountToEdit?.accountType || '')) {
      setFormData(prev => ({ ...prev, icon: selectedType.icon }));
    }
  }, [formData.accountType, accountToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.accountName.trim()) {
      setFormError('Account name cannot be empty.');
      return;
    }
    const balanceValue = parseFloat(formData.initialBalance);
    if (isNaN(balanceValue)) {
      setFormError('Initial balance must be a valid number.');
      return;
    }
    const creditLimitValue = parseFloat(formData.creditLimit) || 0;

    const accountData = {
      ...formData,
      id: accountToEdit ? accountToEdit.id : undefined,
      initialBalance: balanceValue,
      creditLimit: creditLimitValue,
    };
    onSubmit(accountData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ display: 'block' }} onClick={onClose}></div>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {accountToEdit ? 'Edit Account' : 'Add New Account'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-danger py-2">{formError}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="accountName" className="form-label">Account Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="accountName"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    required
                    placeholder="E.g., Techcombank, Momo Wallet"
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="accountType" className="form-label">Account Type</label>
                    <select
                      className="form-select"
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleChange}
                    >
                      {accountTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="bankName" className="form-label">Bank Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="E.g., Techcombank"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="accountNumber" className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="E.g., 1234567890"
                  />
                </div>
                <div className="row">
                  <div className="col-md-7 mb-3">
                    <label htmlFor="initialBalance" className="form-label">Initial Balance <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      id="initialBalance"
                      name="initialBalance"
                      value={formData.initialBalance}
                      onChange={handleChange}
                      required
                      placeholder="0"
                    />
                  </div>
                  <div className="col-md-5 mb-3">
                    <label htmlFor="currency" className="form-label">Currency</label>
                    <select
                      className="form-select"
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="creditLimit" className="form-label">Credit Limit</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    id="creditLimit"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {accountToEdit ? 'Save Changes' : 'Add Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Main Component
const WalletManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Assume token is retrieved from localStorage or another source
  const token = localStorage.getItem('authToken') || 'YOUR_TOKEN_HERE'; // Replace with actual token retrieval logic

  // Configure Axios with default headers
  const axiosInstance = axios.create({
    baseURL: 'https://localhost:7166/api/Accounts',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('');
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleOpenAddModal = () => {
    setAccountToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account) => {
    setAccountToEdit(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAccountToEdit(null);
  };

  const handleSubmitAccount = async (accountData) => {
    try {
      // Remove icon field since API doesn't support it
      const { icon, id, ...dataToSend } = accountData;
      if (accountToEdit) {
        await axiosInstance.put(`/${accountData.id}`, dataToSend);
      } else {
        await axiosInstance.post('', dataToSend);
      }
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/${accountId}`);
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.bankName && account.bankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.accountNumber && account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalBalanceVND = accounts
    .filter(acc => acc.currency === 'VND')
    .reduce((sum, acc) => sum + acc.initialBalance, 0);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div className="mb-2 mb-db-0">
          <h1 className="h2 mb-0">Account Management</h1>
          {accounts.length > 0 && (
            <p className="text-muted mb-0">
              Total Balance (VND): <strong className="text-success">{formatCurrency(totalBalanceVND, 'VND')}</strong>
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <i className="bi bi-plus-circle-fill me-2"></i>Add New Account
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center p-5 border rounded bg-light shadow-sm">
          <i className="bi bi-wallet2" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
          <h4 className="mt-3 mb-2">You have no accounts yet</h4>
          <p className="text-muted">Start managing your finances by adding your first account!</p>
          <button className="btn btn-lg btn-success mt-3" onClick={handleOpenAddModal}>
            <i className="bi bi-plus-lg me-2"></i>Create Account Now
          </button>
        </div>
      ) : filteredAccounts.length === 0 && searchTerm ? (
        <div className="alert alert-warning text-center">
          No accounts found matching the keyword "<strong className="mx-1">{searchTerm}</strong>".
        </div>
      ) : (
        <div className="row g-4">
          {filteredAccounts.map(account => (
            <div className="col-md-6 col-lg-4" key={account.id}>
              <div className="card h-100 shadow-hover">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    <i className={`${account.icon || 'bi-wallet2'} me-3`} style={{ fontSize: '2.2rem', color: '#0d6efd' }}></i>
                    <div className="flex-grow-1">
                      <h5 className="card-title mb-0 text-truncate" title={account.accountName}>{account.accountName}</h5>
                      <small className="text-muted text-capitalize">{account.accountType.replace('_', ' ')}</small>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-light py-0 px-2"
                        type="button"
                        id={`dropdownMenuButton-${account.id}`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`dropdownMenuButton-${account.id}`}>
                        <li>
                          <button className="dropdown-item" onClick={() => handleOpenEditModal(account)}>
                            <i className="bi bi-pencil-square me-2"></i>Edit
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item text-danger" onClick={() => handleDeleteAccount(account.id)}>
                            <i className="bi bi-trash3 me-2"></i>Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <h2
                    className="card-text my-3 fw-bold"
                    style={{ color: account.initialBalance >= 0 ? 'var(--bs-success)' : 'var(--bs-danger)' }}
                  >
                    {formatCurrency(account.initialBalance, account.currency)}
                  </h2>
                  {(account.bankName || account.accountNumber) && (
                    <p className="card-text text-muted small mt-auto mb-0 fst-italic">
                      <i className="bi bi-info-circle me-1"></i>
                      {account.bankName} {account.accountNumber ? `- ${account.accountNumber}` : ''}
                    </p>
                  )}
                  {!account.bankName && !account.accountNumber && <div className="mt-auto"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AccountFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitAccount}
          accountToEdit={accountToEdit}
        />
      )}
    </div>
  );
};

export default WalletManagementPage;