// src/pages/LoanPage.js
import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAllLoans, createLoan, updateLoan, deleteLoan } from '../service/loanService';

// --- Helper Functions ---
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '$0.00';
  // Use en-US locale for USD currency format
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Use en-US locale for date format (e.g., 6/21/2024)
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

// --- Form Modal Component ---
const LoanFormModal = ({ show, onClose, onSubmit, loanToEdit }) => {
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
    // Basic validation
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

  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header"><h5 className="modal-title">{loanToEdit ? 'Edit Loan' : 'Create New Loan'}</h5><button type="button" className="btn-close" onClick={onClose}></button></div>
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
                <div className="col-md-3"><label>Payment Due Day (e.g., 1)</label><input name="paymentDueDate" value={formData.paymentDueDate} type="number" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Loan Date</label><input name="loanDate" value={formData.loanDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Next Payment Date</label><input name="nextPaymentDate" value={formData.nextPaymentDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-4"><label>Final Due Date</label><input name="dueDate" value={formData.dueDate} type="date" className="form-control" onChange={handleChange} /></div>
                <div className="col-md-6"><label>Contract Document (URL)</label><input name="contractDocument" value={formData.contractDocument} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-6"><label>Notes</label><input name="notes" value={formData.notes} className="form-control" onChange={handleChange} /></div>
                <div className="col-md-3"><label>Associated Account ID *</label><input name="accountId" value={formData.accountId} type="number" className="form-control" onChange={handleChange} required /></div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">Save Changes</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState(null);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllLoans();
      setLoans(data);
    } catch (err) {
      setError('Could not fetch loans. Please check your connection or try logging in again.');
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleOpenAddModal = () => {
    setLoanToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loan) => {
    setLoanToEdit(loan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLoanToEdit(null);
  };

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
      if (id) {
        await updateLoan(id, payload);
        alert('Loan updated successfully!');
      } else {
        await createLoan(payload);
        alert('Loan created successfully!');
      }
      fetchLoans();
    } catch (error) {
      console.error('Error saving loan:', error);
      const errorMessage = error.response?.data?.title || error.response?.data?.message || 'Failed to save loan. Please check your data.';
      throw new Error(errorMessage);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await deleteLoan(id);
        alert('Loan deleted successfully!');
        fetchLoans();
      } catch (error) {
        alert('Failed to delete loan.');
        console.error('Error deleting loan:', error);
      }
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
                      <div className="progress mt-1" style={{ height: '8px' }}>
                        <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}></div>
                      </div>
                      <small className="text-muted">{Math.round(progress)}% paid</small>
                    </td>
                    <td>{loan.borrower}</td>
                    <td>{formatCurrency(loan.originalAmount)}</td>
                    <td className="fw-bold">{formatCurrency(loan.currentBalance)}</td>
                    <td>{formatDate(loan.loanDate)}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-secondary me-2" title="Edit" onClick={() => handleOpenEditModal(loan)}><i className="bi bi-pencil-fill"></i></button>
                      <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDeleteLoan(loan.loanId)}><i className="bi bi-trash3-fill"></i></button>
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
      <LoanFormModal show={isModalOpen} onClose={handleCloseModal} onSubmit={handleSaveLoan} loanToEdit={loanToEdit} />
    </div>
  );
};

export default LoanManagement;