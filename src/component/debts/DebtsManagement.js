import React, { useState, useEffect } from 'react';

// --- Debts Service (Đã thêm API thanh toán) ---
const debtsService = {
  baseUrl: 'https://localhost:7166/api/Debts',
  _getAuthHeaders(includeContentType = true) {
    const token = localStorage.getItem('authToken'); 
    const headers = {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },
  async getAllDebts() {
    try {
      const response = await fetch(this.baseUrl, { headers: this._getAuthHeaders(false) });
      if (!response.ok) throw new Error('Failed to fetch debts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching debts:', error);
      throw error;
    }
  },
  async createDebt(debt) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this._getAuthHeaders(true),
        body: JSON.stringify(debt),
      });
      if (!response.ok) throw new Error('Failed to create debt');
      return await response.json();
    } catch (error) {
      console.error('Error creating debt:', error);
      throw error;
    }
  },
  async updateDebt(id, debt) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this._getAuthHeaders(true),
        body: JSON.stringify(debt),
      });
      if (!response.ok) throw new Error('Failed to update debt');
      if (response.status === 204) return;
      return await response.json();
    } catch (error) {
      console.error('Error updating debt:', error);
      throw error;
    }
  },
  async deleteDebt(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this._getAuthHeaders(false)
      });
      if (!response.ok) throw new Error('Failed to delete debt');
      return true;
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  },
  async processPayment(id, paymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/process-payment`, {
        method: 'POST',
        headers: this._getAuthHeaders(true),
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Payment failed' }));
        throw new Error(errorBody.title || errorBody.message || 'Payment processing failed on the server.');
      }
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
};

// --- Payment Modal Component ---
const PaymentModal = ({ debt, onProcess, onCancel }) => {
  const [amount, setAmount] = useState('');
  useEffect(() => {
    if (debt) {
      setAmount(debt.minimumPayment || '');
    }
  }, [debt]);
  if (!debt) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount > 0) {
      onProcess(parseFloat(amount));
    }
  };
  // <<< THAY ĐỔI Ở ĐÂY >>>
  const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header"><h5 className="modal-title">Make Payment for: {debt.debtName}</h5><button type="button" className="btn-close" onClick={onCancel}></button></div>
            <div className="modal-body">
              <p className="mb-3">Current Balance: <strong className="text-danger">{formatCurrency(debt.currentBalance)}</strong></p>
              <div className="mb-3">
                <label htmlFor="paymentAmount" className="form-label">Payment Amount</label>
                <input type="number" className="form-control" id="paymentAmount" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" required autoFocus/>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-success">Confirm Payment</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Debt Form Component ---
const DebtForm = ({ debt, accounts, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    debtId: debt?.debtId || 0,
    debtName: debt?.debtName || '',
    debtType: debt?.debtType || '',
    creditor: debt?.creditor || '',
    originalAmount: debt?.originalAmount || 0,
    currentBalance: debt?.currentBalance || 0,
    interestRate: debt?.interestRate || 0,
    minimumPayment: debt?.minimumPayment || 0,
    paymentDueDate: debt?.paymentDueDate || 1,
    nextPaymentDate: debt?.nextPaymentDate ? debt.nextPaymentDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
    payoffDate: debt?.payoffDate ? debt.payoffDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
    isActive: debt ? debt.isActive : true,
    accountId: debt?.accountId || '', 
  });

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' || type === 'range') ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header"><h5 className="modal-title">{debt ? 'Edit Debt' : 'Add New Debt'}</h5><button type="button" className="btn-close" onClick={onCancel}></button></div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6"><label htmlFor="debtName" className="form-label">Debt Name</label><input type="text" className="form-control" id="debtName" name="debtName" value={formData.debtName} onChange={handleChange} required /></div>
                <div className="col-md-6"><label htmlFor="debtType" className="form-label">Debt Type</label><select className="form-select" id="debtType" name="debtType" value={formData.debtType} onChange={handleChange} required><option value="">Select a type...</option><option value="Credit Card">Credit Card</option><option value="Personal Loan">Personal Loan</option><option value="Mortgage">Mortgage</option><option value="Car Loan">Car Loan</option><option value="Student Loan">Student Loan</option><option value="Other">Other</option></select></div>
                <div className="col-md-6"><label htmlFor="creditor" className="form-label">Creditor</label><input type="text" className="form-control" id="creditor" name="creditor" value={formData.creditor} onChange={handleChange} required /></div>
                <div className="col-md-6"><label htmlFor="originalAmount" className="form-label">Original Amount</label><input type="number" className="form-control" id="originalAmount" name="originalAmount" value={formData.originalAmount} onChange={handleChange} min="0" step="0.01" required /></div>
                <div className="col-md-6"><label htmlFor="currentBalance" className="form-label">Current Balance</label><input type="number" className="form-control" id="currentBalance" name="currentBalance" value={formData.currentBalance} onChange={handleChange} min="0" step="0.01" required /></div>
                <div className="col-md-6"><label htmlFor="interestRate" className="form-label">Interest Rate (%)</label><input type="number" className="form-control" id="interestRate" name="interestRate" value={formData.interestRate} onChange={handleChange} min="0" step="0.01" required /></div>
                <div className="col-md-6"><label htmlFor="minimumPayment" className="form-label">Minimum Payment</label><input type="number" className="form-control" id="minimumPayment" name="minimumPayment" value={formData.minimumPayment} onChange={handleChange} min="0" step="0.01" required /></div>
                <div className="col-md-6"><label htmlFor="paymentDueDate" className="form-label">Due Day of Month</label><input type="number" className="form-control" id="paymentDueDate" name="paymentDueDate" value={formData.paymentDueDate} onChange={handleChange} min="1" max="31" required /></div>
                <div className="col-md-6"><label htmlFor="nextPaymentDate" className="form-label">Next Payment Date</label><input type="datetime-local" className="form-control" id="nextPaymentDate" name="nextPaymentDate" value={formData.nextPaymentDate} onChange={handleChange} required /></div>
                <div className="col-md-6"><label htmlFor="payoffDate" className="form-label">Estimated Payoff Date</label><input type="datetime-local" className="form-control" id="payoffDate" name="payoffDate" value={formData.payoffDate} onChange={handleChange} required /></div>
                <div className="col-md-6"><label htmlFor="accountId" className="form-label">Associated Account</label><select className="form-select" id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required><option value="">Select an account...</option>{accounts.map(acc => (<option key={acc.accountId} value={acc.accountId}>{acc.accountName}</option>))}</select></div>
                <div className="col-12"><div className="form-check mt-2"><input className="form-check-input" type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} /><label className="form-check-label" htmlFor="isActive">This debt is active</label></div></div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn btn-primary">{debt ? 'Update' : 'Save'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Debt Card Component ---
const DebtCard = ({ debt, onEdit, onDelete, onMakePayment }) => {
  // <<< THAY ĐỔI Ở ĐÂY >>>
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US'); // Changed to US format for consistency
  const getDebtTypeBadge = (type) => {
    const badges = { 'Credit Card': 'bg-danger', 'Personal Loan': 'bg-primary', 'Mortgage': 'bg-success', 'Car Loan': 'bg-info text-dark', 'Student Loan': 'bg-warning text-dark', 'Other': 'bg-secondary' };
    return badges[type] || badges['Other'];
  };
  const progressPercentage = debt.originalAmount > 0 ? ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100 : 0;
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div><h5 className="card-title mb-1">{debt.debtName}</h5><span className={`badge ${getDebtTypeBadge(debt.debtType)}`}>{debt.debtType}</span></div>
          <div className="btn-group"><button onClick={() => onMakePayment(debt)} className="btn btn-sm btn-outline-success" title="Make Payment"><i className="bi bi-cash-coin"></i></button><button onClick={() => onEdit(debt)} className="btn btn-sm btn-outline-primary" title="Edit"><i className="bi bi-pencil-square"></i></button><button onClick={() => onDelete(debt.debtId)} className="btn btn-sm btn-outline-danger" title="Delete"><i className="bi bi-trash3"></i></button></div>
        </div>
        <ul className="list-group list-group-flush flex-grow-1">
          <li className="list-group-item d-flex justify-content-between align-items-center px-0"><small>Creditor:</small><span className="fw-bold">{debt.creditor}</span></li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0"><small>Current Balance:</small><span className="fw-bold text-danger">{formatCurrency(debt.currentBalance)}</span></li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0"><small>Min. Payment:</small><span className="fw-bold">{formatCurrency(debt.minimumPayment)}</span></li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0"><small>Interest Rate:</small><span className="fw-bold">{debt.interestRate}%</span></li>
          <li className="list-group-item d-flex justify-content-between align-items-center px-0"><small>Next Payment:</small><span className="fw-bold">{formatDate(debt.nextPaymentDate)}</span></li>
        </ul>
        <div className="mt-auto pt-3">
          <div className="d-flex justify-content-between small mb-1"><span>Payoff Progress</span><span>{progressPercentage.toFixed(1)}%</span></div>
          <div className="progress" style={{ height: '8px' }}><div className="progress-bar bg-success" role="progressbar" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div></div>
          {!debt.isActive && (<div className="d-flex align-items-center small text-muted mt-2"><i className="bi bi-exclamation-circle me-1"></i>Inactive</div>)}
        </div>
      </div>
    </div>
  );
};

// --- Main Debts Management Component ---
const DebtsManagement = () => {
  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [debtsData, accountsResponse] = await Promise.all([
        debtsService.getAllDebts(),
        fetch('https://localhost:7166/api/Accounts', { headers: authHeaders })
      ]);
      if (!accountsResponse.ok) { throw new Error('Failed to fetch accounts'); }
      const accountsData = await accountsResponse.json();
      setDebts(debtsData);
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      setError('Could not load page data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshDebts = async () => {
      try {
        const data = await debtsService.getAllDebts();
        setDebts(data);
        setError(null);
      } catch (err) {
        setError('Could not refresh debt list.');
      }
  }

  const handleSaveDebt = async (debtData) => {
    try {
      setError(null);
      if (editingDebt) {
        await debtsService.updateDebt(editingDebt.debtId, debtData);
      } else {
        const createPayload = { debtName: debtData.debtName, debtType: debtData.debtType, creditor: debtData.creditor, originalAmount: debtData.originalAmount, currentBalance: debtData.currentBalance, interestRate: debtData.interestRate, minimumPayment: debtData.minimumPayment, paymentDueDate: debtData.paymentDueDate, nextPaymentDate: new Date(debtData.nextPaymentDate).toISOString(), payoffDate: new Date(debtData.payoffDate).toISOString(), accountId: parseInt(debtData.accountId, 10) };
        await debtsService.createDebt(createPayload);
      }
      await refreshDebts();
      handleCloseModals();
    } catch (err) {
      setError('Could not save the debt. Please try again.');
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        setError(null);
        await debtsService.deleteDebt(debtId);
        await refreshDebts();
      } catch (err) {
        setError('Could not delete the debt. Please try again.');
      }
    }
  };

  const handleProcessPayment = async (paymentAmount) => {
    if (!payingDebt) return;
    setError(null);

    if (paymentAmount > payingDebt.currentBalance) {
      setError(`Payment amount cannot be greater than the current balance of ${formatCurrency(payingDebt.currentBalance)}.`);
      return;
    }

    try {
      const paymentData = { paymentDate: new Date().toISOString(), paymentAmount: paymentAmount };
      await debtsService.processPayment(payingDebt.debtId, paymentData);
      await refreshDebts();
      handleCloseModals();
    } catch (err) {
      setError(`Payment failed: ${err.message}`);
    }
  };

  const handleOpenEditModal = (debt) => { setEditingDebt(debt); setShowForm(true); };
  const handleOpenPaymentModal = (debt) => { setPayingDebt(debt); setShowPaymentModal(true); };
  const handleCloseModals = () => { setShowForm(false); setEditingDebt(null); setShowPaymentModal(false); setPayingDebt(null); };

  const activeDebts = debts.filter(d => d.isActive);
  const calculateTotalDebt = () => activeDebts.reduce((total, debt) => total + debt.currentBalance, 0);
  const calculateTotalMinimumPayment = () => activeDebts.reduce((total, debt) => total + debt.minimumPayment, 0);
  // <<< THAY ĐỔI Ở ĐÂY >>>
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) { return ( <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div> ); }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Debt Management</h1>
        <button onClick={() => { setEditingDebt(null); setShowForm(true); }} className="btn btn-primary"><i className="bi bi-plus-lg me-2"></i>Add New Debt</button>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="row g-4 mb-4">
        <div className="col-md-4"><div className="card text-center h-100"><div className="card-body"><h6 className="card-subtitle mb-2 text-muted">Total Active Debt</h6><p className="card-text h4 text-danger">{formatCurrency(calculateTotalDebt())}</p></div></div></div>
        <div className="col-md-4"><div className="card text-center h-100"><div className="card-body"><h6 className="card-subtitle mb-2 text-muted">Monthly Minimum Payment</h6><p className="card-text h4 text-primary">{formatCurrency(calculateTotalMinimumPayment())}</p></div></div></div>
        <div className="col-md-4"><div className="card text-center h-100"><div className="card-body"><h6 className="card-subtitle mb-2 text-muted">Active Debts Count</h6><p className="card-text h4 text-success">{activeDebts.length}</p></div></div></div>
      </div>
      {debts.length > 0 ? (
        <div className="row g-4">
          {debts.map((debt) => (
            <div key={debt.debtId} className="col-md-6 col-lg-4">
              <DebtCard debt={debt} onEdit={handleOpenEditModal} onDelete={handleDeleteDebt} onMakePayment={handleOpenPaymentModal}/>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <i className="bi bi-journal-x" style={{ fontSize: '3rem', color: 'var(--bs-gray-500)' }}></i>
          <h3 className="mt-3">No Debts Found</h3>
          <p className="text-muted">Start by adding your first debt record.</p>
          <button onClick={() => { setEditingDebt(null); setShowForm(true); }} className="btn btn-primary mt-2">Add New Debt</button>
        </div>
      )}
      {showForm && <DebtForm debt={editingDebt} accounts={accounts} onSave={handleSaveDebt} onCancel={handleCloseModals} />}
      {showPaymentModal && <PaymentModal debt={payingDebt} onProcess={handleProcessPayment} onCancel={handleCloseModals} />}
    </div>
  );
};

export default DebtsManagement;