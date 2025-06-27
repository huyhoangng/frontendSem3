// src/pages/LoanPage.js
import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
// Cập nhật import để có cả getAccounts
import { getAllLoans, createLoan, updateLoan, deleteLoan, createLoanPayment, getAccounts } from '../service/loanService';

// --- Helper Functions ---
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US');
};

const toInputDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().slice(0, 10);
    } catch (e) {
        return '';
    }
};

// --- Form Modal để tạo/sửa Khoản vay ---
const LoanFormModal = ({ show, onClose, onSubmit, loanToEdit, accounts = [] }) => {
  const initialFormState = {
    loanName: '', loanType: '', borrower: '', borrowerPhone: '', borrowerEmail: '',
    originalAmount: '', interestRate: '', expectedPayment: '', paymentDueDate: 1,
    nextPaymentDate: '', loanDate: toInputDate(new Date()), dueDate: '',
    contractDocument: '', notes: '', accountId: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loanToEdit) {
      setFormData({
        ...loanToEdit,
        originalAmount: loanToEdit.originalAmount?.toString() || '',
        interestRate: loanToEdit.interestRate?.toString() || '',
        expectedPayment: loanToEdit.expectedPayment?.toString() || '',
        accountId: loanToEdit.accountId?.toString() || '',
        loanDate: toInputDate(loanToEdit.loanDate),
        dueDate: toInputDate(loanToEdit.dueDate),
        nextPaymentDate: toInputDate(loanToEdit.nextPaymentDate),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [loanToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.loanName || !formData.originalAmount || !formData.borrower || !formData.accountId) {
        setError('Please fill in all required fields (*).');
        return;
    }
    try {
      await onSubmit(formData, loanToEdit?.loanId);
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the loan.');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      {/* <<< THAY ĐỔI DUY NHẤT Ở ĐÂY: Thêm class "modal-dialog-centered" >>> */}
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{loanToEdit ? 'Edit Loan' : 'Create New Loan'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="row g-3">
                <div className="col-md-6"><label>Loan Name *</label><input name="loanName" value={formData.loanName} className="form-control" onChange={handleChange} required /></div>
                <div className="col-md-6"><label>Loan Type</label><input name="loanType" value={formData.loanType} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Borrower *</label><input name="borrower" value={formData.borrower} className="form-control" onChange={handleChange} required /></div>
                <div className="col-md-4"><label>Borrower Phone</label><input name="borrowerPhone" value={formData.borrowerPhone} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Borrower Email</label><input name="borrowerEmail" value={formData.borrowerEmail} type="email" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-3"><label>Original Amount *</label><input name="originalAmount" value={formData.originalAmount} type="number" step="0.01" className="form-control" onChange={handleChange} required /></div>
                <div className="col-md-3"><label>Interest Rate (%)</label><input name="interestRate" value={formData.interestRate} type="number" step="0.01" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-3"><label>Expected Payment</label><input name="expectedPayment" value={formData.expectedPayment} type="number" step="0.01" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-3"><label>Payment Due Day</label><input name="paymentDueDate" value={formData.paymentDueDate} type="number" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Loan Date</label><input name="loanDate" value={formData.loanDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Next Payment Date</label><input name="nextPaymentDate" value={formData.nextPaymentDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Final Due Date</label><input name="dueDate" value={formData.dueDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-6"><label>Contract Document (URL)</label><input name="contractDocument" value={formData.contractDocument} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-6"><label>Notes</label><input name="notes" value={formData.notes} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-6"><label>Associated Account *</label><select name="accountId" value={formData.accountId} className="form-select" onChange={handleChange} required><option value="">-- Select an Account --</option>{accounts.map(acc => (<option key={acc.accountId} value={acc.accountId}>{acc.accountName} ({formatCurrency(acc.balance)})</option>))}</select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Component Modal để Trả tiền ---
const LoanPaymentModal = ({ show, onClose, onSubmit, loanToPay }) => {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show || !loanToPay) return null;

    const remainingBalance = loanToPay.currentBalance;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) { setError('Payment amount must be a positive number.'); return; }
        if (paymentAmount > remainingBalance) { setError(`Payment cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}.`); return; }
        const payload = {
            loanId: loanToPay.loanId, paymentAmount: paymentAmount, paymentDate: new Date().toISOString(),
            notes: notes, principalAmount: 0, interestAmount: 0, paymentMethod: "Online Transfer"
        };
        setIsSubmitting(true);
        try {
            await onSubmit(payload);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to process payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header"><h5 className="modal-title">Make a Payment</h5><button type="button" className="btn-close" onClick={onClose}></button></div>
                        <div className="modal-body">
                            <p className="mb-2">For loan: <strong>{loanToPay.loanName}</strong></p>
                            <p className="text-muted">Remaining Balance: {formatCurrency(remainingBalance)}</p>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="mb-3"><label htmlFor="paymentAmount" className="form-label">Payment Amount *</label><input type="number" step="0.01" className="form-control" id="paymentAmount" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus /></div>
                            <div className="mb-3"><label htmlFor="notes" className="form-label">Notes</label><textarea className="form-control" id="notes" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea></div>
                        </div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button><button type="submit" className="btn btn-success" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Submit Payment'}</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Component chính ---
const LoanManagement = () => {
    const [loans, setLoans] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [loanToEdit, setLoanToEdit] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [loanToPay, setLoanToPay] = useState(null);

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [loansData, accountsData] = await Promise.all([ getAllLoans(), getAccounts() ]);
            setLoans(loansData);
            setAccounts(accountsData);
        } catch (err) {
            setError('Could not fetch initial data. Please check your connection or try logging in again.');
            console.error('Error fetching initial data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    const handleOpenAddModal = () => { setLoanToEdit(null); setIsFormModalOpen(true); };
    const handleCloseFormModal = () => { setIsFormModalOpen(false); setLoanToEdit(null); };
    
    const handleOpenPaymentModal = (loan) => { setLoanToPay(loan); setIsPaymentModalOpen(true); };
    const handleClosePaymentModal = () => { setIsPaymentModalOpen(false); setLoanToPay(null); };

    const handleSaveLoan = async (formData, id) => {
        const payload = {
            loanId: id || 0,
            loanName: formData.loanName,
            loanType: formData.loanType,
            borrower: formData.borrower,
            borrowerPhone: formData.borrowerPhone,
            borrowerEmail: formData.borrowerEmail,
            originalAmount: parseFloat(formData.originalAmount) || 0,
            currentBalance: id ? formData.currentBalance : parseFloat(formData.originalAmount) || 0,
            interestRate: parseFloat(formData.interestRate) || 0,
            paymentDueDate: parseInt(formData.paymentDueDate) || 1,
            expectedPayment: parseFloat(formData.expectedPayment) || 0,
            loanDate: new Date(formData.loanDate).toISOString(),
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            nextPaymentDate: formData.nextPaymentDate ? new Date(formData.nextPaymentDate).toISOString() : null,
            notes: formData.notes,
            contractDocument: formData.contractDocument,
            accountId: parseInt(formData.accountId),
        };
        try {
            if (id) { await updateLoan(id, payload); alert('Loan updated successfully!'); } 
            else { await createLoan(payload); alert('Loan created successfully!'); }
            fetchInitialData();
        } catch (error) {
            console.error('Error saving loan:', error);
            throw new Error(error.response?.data?.title || error.response?.data?.message || 'Failed to save loan.');
        }
    };

    const handleSavePayment = async (payload) => {
        try {
            await createLoanPayment(payload.loanId, payload);
            alert('Payment submitted successfully!');
            fetchInitialData();
        } catch (error) {
            console.error('Error submitting payment:', error);
            throw new Error(error.response?.data?.message || 'Failed to submit payment.');
        }
    };
    
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4"><h2 className="mb-0">Loan Management</h2><button className="btn btn-primary" onClick={handleOpenAddModal}><i className="bi bi-plus-circle me-2"></i>Add Loan</button></div>
            {loading && <div className="text-center"><div className="spinner-border"></div><p>Loading data...</p></div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th style={{ width: '25%' }}>Name & Progress</th>
                                <th>Borrower</th>
                                <th>Principal</th>
                                <th>Remaining</th>
                                <th>Loan Date</th>
                                <th>Due Date</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.length > 0 ? loans.map((loan) => {
                                const paidAmount = (loan.originalAmount || 0) - (loan.currentBalance || 0);
                                const progress = loan.originalAmount > 0 ? (paidAmount / loan.originalAmount) * 100 : 0;
                                return (
                                    <tr key={loan.loanId}>
                                        <td>
                                            <div className="fw-bold">{loan.loanName}</div>
                                            <div className="progress mt-1" style={{ height: '8px' }}><div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}></div></div>
                                            <small className="text-muted">{Math.round(progress)}% paid</small>
                                        </td>
                                        <td>{loan.borrower}</td>
                                        <td>{formatCurrency(loan.originalAmount)}</td>
                                        <td className="fw-bold">{formatCurrency(loan.currentBalance)}</td>
                                        <td>{formatDate(loan.loanDate)}</td>
                                        <td>{formatDate(loan.dueDate)}</td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-outline-success" 
                                                title="Make Payment" 
                                                onClick={() => handleOpenPaymentModal(loan)}
                                                disabled={loan.currentBalance <= 0}
                                            >
                                                <i className="bi bi-cash-coin"></i>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" className="text-center p-4">No loans found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            <LoanFormModal show={isFormModalOpen} onClose={handleCloseFormModal} onSubmit={handleSaveLoan} loanToEdit={loanToEdit} accounts={accounts} />
            <LoanPaymentModal show={isPaymentModalOpen} onClose={handleClosePaymentModal} onSubmit={handleSavePayment} loanToPay={loanToPay} />
        </div>
    );
};

export default LoanManagement;