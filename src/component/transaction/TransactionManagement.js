// src/component/transaction/TransactionManagement.js
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../service/transactionService';
import { getAccounts } from '../service/accountService';
import { getCategories } from '../service/categoryService';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Helpers ---
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatFullDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDateForChart = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

// --- Component Form Modal ---
const TransactionFormModal = ({ show, onClose, onSubmit, transactionToEdit, accounts = [], categories = [] }) => {
    const initialFormState = { accountId: '', categoryId: '', amount: '', transactionType: 'Expense', transactionDate: new Date().toISOString().slice(0, 10), description: '', tags: '', isRecurring: false, recurringFrequency: 'Monthly' };
    const availableTags = [ { value: 'food', icon: '🍔', label: 'Food' }, { value: 'transport', icon: '🚗', label: 'Transport' }, { value: 'shopping', icon: '🛍️', label: 'Shopping' }, { value: 'bills', icon: '📝', label: 'Bills' }, { value: 'entertainment', icon: '🎮', label: 'Entertainment' }, { value: 'health', icon: '💊', label: 'Health' }, { value: 'education', icon: '📚', label: 'Education' }, { value: 'salary', icon: '💰', label: 'Salary' }, { value: 'investment', icon: '📈', label: 'Investment' }, { value: 'other', icon: '📌', label: 'Other' }];
    const [formData, setFormData] = useState(initialFormState);
    const [selectedTags, setSelectedTags] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (transactionToEdit) {
            setFormData({ accountId: transactionToEdit.accountId?.toString() || '', categoryId: transactionToEdit.categoryId?.toString() || '', amount: transactionToEdit.amount?.toString() || '', transactionType: transactionToEdit.transactionType || 'Expense', transactionDate: transactionToEdit.transactionDate ? new Date(transactionToEdit.transactionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), description: transactionToEdit.description || '', tags: transactionToEdit.tags || '', isRecurring: transactionToEdit.isRecurring || false, recurringFrequency: transactionToEdit.recurringFrequency || 'Monthly' });
            setSelectedTags(transactionToEdit.tags ? transactionToEdit.tags.split(',').map(t => t.trim()) : []);
        } else {
            setFormData(initialFormState);
            setSelectedTags([]);
        }
    }, [transactionToEdit]);

    const handleTagClick = (tag) => { setSelectedTags(prev => { const isSelected = prev.includes(tag.value); return isSelected ? prev.filter(t => t !== tag.value) : [...prev, tag.value]; }); };
    const handleChange = (e) => { const { name, value, type, checked } = e.target; const newValue = type === 'checkbox' ? checked : value; setFormData(prev => ({ ...prev, [name]: newValue, ...(name === 'transactionType' && { categoryId: '' }), ...(name === 'isRecurring' && !checked && { recurringFrequency: 'Monthly' }) })); };
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const requiredFields = { accountId: formData.accountId, categoryId: formData.categoryId, amount: formData.amount, transactionDate: formData.transactionDate };
        const missingFields = Object.entries(requiredFields).filter(([_, value]) => !value).map(([field]) => field);
        if (missingFields.length > 0) { setError(`Please fill in all required fields: ${missingFields.join(', ')}`); return; }
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) { setError("Amount must be a positive number."); return; }
        const payload = { accountId: Number(formData.accountId), categoryId: Number(formData.categoryId), amount, transactionType: formData.transactionType, transactionDate: new Date(formData.transactionDate).toISOString(), description: formData.description || '', tags: selectedTags.join(', '), isRecurring: formData.isRecurring || false, recurringFrequency: formData.isRecurring ? (formData.recurringFrequency || 'Monthly') : null };
        try { await onSubmit(payload, transactionToEdit?.id); onClose(); } catch (err) { setError(err.message || 'Failed to save transaction.'); }
    };

    if (!show) return null;
    
    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header"><h5 className="modal-title">{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</h5><button type="button" className="btn-close" onClick={onClose}></button></div>
                        <div className="modal-body">
                            {error && (<div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>)}
                            <div className="row g-3">
                                <div className="col-md-6"><label htmlFor="amount" className="form-label">Amount <span className="text-danger">*</span></label><input type="number" step="0.01" min="0" className="form-control" id="amount" name="amount" value={formData.amount} onChange={handleChange} required /></div>
                                <div className="col-md-6"><label htmlFor="transactionType" className="form-label">Type <span className="text-danger">*</span></label><select className="form-select" id="transactionType" name="transactionType" value={formData.transactionType} onChange={handleChange} required><option value="Expense">Expense</option><option value="Income">Income</option></select></div>
                                <div className="col-md-6"><label htmlFor="accountId" className="form-label">Account <span className="text-danger">*</span></label><select className="form-select" id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required><option value="">Select an account</option>{accounts.filter(acc => acc.isActive).map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>))}</select></div>
                                <div className="col-md-6"><label htmlFor="categoryId" className="form-label">Category <span className="text-danger">*</span></label><select className="form-select" id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required><option value="">Select a category</option>{categories.filter(cat => cat.isActive && cat.type.toUpperCase() === formData.transactionType.toUpperCase()).map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
                                <div className="col-12"><label htmlFor="description" className="form-label">Description</label><input type="text" className="form-control" id="description" name="description" value={formData.description} onChange={handleChange}/></div>
                                <div className="col-md-6"><label htmlFor="transactionDate" className="form-label">Date</label><input type="date" className="form-control" id="transactionDate" name="transactionDate" value={formData.transactionDate} onChange={handleChange} required/></div>
                                <div className="col-12"><label className="form-label">Tags</label><div className="d-flex flex-wrap gap-2">{availableTags.map(tag => (<button key={tag.value} type="button" className={`btn btn-sm ${selectedTags.includes(tag.value) ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleTagClick(tag)}><span className="me-1">{tag.icon}</span>{tag.label}</button>))}</div></div>
                                <div className="col-12"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="isRecurring" name="isRecurring" checked={formData.isRecurring} onChange={handleChange}/><label className="form-check-label" htmlFor="isRecurring">Is Recurring?</label></div>{formData.isRecurring && (<div className="mt-2"><label htmlFor="recurringFrequency" className="form-label">Recurring Frequency</label><select className="form-select" id="recurringFrequency" name="recurringFrequency" value={formData.recurringFrequency} onChange={handleChange}><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option></select></div>)}</div>
                            </div>
                        </div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Close</button><button type="submit" className="btn btn-primary">Save changes</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const TransactionItem = memo(({ transaction, accounts, onEdit, onDelete }) => {
    const account = accounts.find(acc => acc.id === transaction.accountId);
    const isIncome = transaction.transactionType === 'Income';
    return (
        <div className="card transaction-card mb-3"><div className="card-body"><div className="d-flex align-items-center"><div className={`transaction-icon me-3 ${isIncome ? 'icon-income' : 'icon-expense'}`}><i className={`bi ${isIncome ? 'bi-arrow-up' : 'bi-arrow-down'}`}></i></div><div className="flex-grow-1"><div className="d-flex justify-content-between"><span className="fw-bold">{transaction.description || "Transaction"}</span><span className={`fw-bold h5 mb-0 ${isIncome ? 'text-success' : 'text-danger'}`}>{isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}</span></div><div className="text-muted small"><span>{transaction.categoryName}</span><span className="mx-2">•</span><span>{account?.name || 'Unknown Account'}</span><span className="mx-2">•</span><span>{formatFullDate(transaction.transactionDate)}</span></div></div><div className="transaction-actions ms-3"><button className="btn btn-sm btn-outline-secondary me-2" title="Edit" onClick={() => onEdit(transaction)}><i className="bi bi-pencil"></i></button><button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => onDelete(transaction.id)}><i className="bi bi-trash"></i></button></div></div></div></div>
    );
});

// --- Component trang chính ---
function TransactionManagement() {
    const [allTransactions, setAllTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [balanceChartData, setBalanceChartData] = useState({ labels: [], datasets: [] });
    const [expenseChartData, setExpenseChartData] = useState({ labels: [], datasets: [] });
    const [filterView, setFilterView] = useState('All'); 

    const handleApiError = useCallback((err, context = 'operation') => {
        if (err.response && err.response.status === 401) { setError('Your session has expired. Redirecting to login page...'); localStorage.removeItem('authToken'); localStorage.removeItem('userId'); setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 3000); } else { setError(`Error during ${context}: ${err.message || 'An unknown error occurred.'}`); }
        console.error(`API Error (${context}):`, err);
    }, []);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [transactionsData, accountsData, categoriesData] = await Promise.all([
                getTransactions(), getAccounts(), getCategories(),
            ]);
            setAllTransactions(transactionsData);
            setAccounts(accountsData);
            setCategories(categoriesData);
        } catch (err) {
            handleApiError(err, 'fetching initial data');
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        const filteredTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.transactionDate);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });

        if (filteredTransactions.length > 0) {
            const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
            const uniqueDates = [...new Set(sortedTransactions.map(tx => tx.transactionDate.split('T')[0]))].sort();
            
            let cumulativeBalance = 0;
            const balanceDataPoints = uniqueDates.map(date => {
                const dailyNetChange = sortedTransactions.filter(tx => tx.transactionDate.split('T')[0] === date).reduce((sum, tx) => sum + (tx.transactionType === 'Income' ? tx.amount : -tx.amount), 0);
                cumulativeBalance += dailyNetChange;
                return cumulativeBalance;
            });
            setBalanceChartData({
                labels: uniqueDates.map(d => formatDateForChart(d)),
                datasets: [{ 
                    label: 'Net Balance', data: balanceDataPoints, fill: true, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)', tension: 0.4, 
                    pointRadius: 0, pointHoverRadius: 6, pointHitRadius: 20, pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                }]
            });

            const expenseTransactions = sortedTransactions.filter(tx => tx.transactionType === 'Expense');
            const expensesByCategory = {};
            expenseTransactions.forEach(tx => {
                const categoryName = tx.categoryName || 'Uncategorized';
                if (!expensesByCategory[categoryName]) expensesByCategory[categoryName] = [];
                expensesByCategory[categoryName].push({ date: tx.transactionDate.split('T')[0], amount: tx.amount });
            });
            const categoryDatasets = Object.entries(expensesByCategory).map(([categoryName, txs], index) => {
                let cumulativeExpense = 0;
                const dataPoints = uniqueDates.map(date => {
                    const dailyTotal = txs.filter(t => t.date === date).reduce((sum, t) => sum + t.amount, 0);
                    cumulativeExpense += dailyTotal;
                    return cumulativeExpense;
                });
                const colors = [ 'rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)' ];
                const color = colors[index % colors.length];
                return { label: categoryName, data: dataPoints, borderColor: color, backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 6 };
            });
            setExpenseChartData({ labels: uniqueDates.map(d => formatDateForChart(d)), datasets: categoryDatasets });

        } else {
            setBalanceChartData({ labels: [], datasets: [] });
            setExpenseChartData({ labels: [], datasets: [] });
        }
    }, [allTransactions, currentMonth, currentYear]);

    const handleOpenModal = (transaction = null) => { setTransactionToEdit(transaction); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setTransactionToEdit(null); };
    const handleSaveTransaction = async (payload, id) => { try { if (id) { await updateTransaction(id, payload); } else { await createTransaction(payload); } await fetchAllData(); } catch (err) { throw new Error(err.response?.data?.title || err.message || 'An error occurred.'); } };
    const handleDelete = async (id) => { if (window.confirm('Are you sure?')) { try { await deleteTransaction(id); await fetchAllData(); } catch (err) { handleApiError(err, 'deleting transaction'); } } };

    const balanceChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Balance Trend This Month' }, tooltip: { mode: 'index', intersect: false, callbacks: { label: (context) => `Balance: ${formatCurrency(context.parsed.y)}` } } }, scales: { y: { ticks: { callback: (value) => formatCurrency(value), maxTicksLimit: 6 } } } };
    const expenseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Cumulative Expense by Category This Month' }, tooltip: { mode: 'index', intersect: false, callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } } }, scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } } };

    const transactionsForCurrentMonth = useMemo(() => {
        return allTransactions.filter(tx => {
            const txDate = new Date(tx.transactionDate);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });
    }, [allTransactions, currentMonth, currentYear]);

    const displayTransactions = useMemo(() => {
        if (filterView === 'Income') {
            return transactionsForCurrentMonth.filter(tx => tx.transactionType === 'Income');
        }
        if (filterView === 'Expense') {
            return transactionsForCurrentMonth.filter(tx => tx.transactionType === 'Expense');
        }
        return transactionsForCurrentMonth;
    }, [transactionsForCurrentMonth, filterView]);

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4"><h1 className="h2">Transactions</h1><button className="btn btn-primary" onClick={() => handleOpenModal()}><i className="bi bi-plus-circle-fill me-2"></i> Add Transaction</button></div>
            
            <div className="btn-group w-100 mb-4" role="group">
                <button type="button" className={`btn ${filterView === 'All' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilterView('All')}>All</button>
                <button type="button" className={`btn ${filterView === 'Income' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilterView('Income')}>Income</button>
                <button type="button" className={`btn ${filterView === 'Expense' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFilterView('Expense')}>Expense</button>
            </div>
            
            {isLoading && <div className="text-center"><div className="spinner-border"></div></div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            {!isLoading && !error && (
                <>
                    {displayTransactions.length > 0 ? (
                        <div className="row g-4 mb-4">
                            {filterView === 'All' && (
                                <>
                                    <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-body"><div style={{ height: '300px' }}><Line options={balanceChartOptions} data={balanceChartData} /></div></div></div></div>
                                    <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-body"><div style={{ height: '300px' }}><Line options={expenseChartOptions} data={expenseChartData} /></div></div></div></div>
                                </>
                            )}
                            {filterView === 'Expense' && (
                                <div className="col-12"><div className="card shadow-sm h-100"><div className="card-body"><div style={{ height: '300px' }}><Line options={expenseChartOptions} data={expenseChartData} /></div></div></div></div>
                            )}
                        </div>
                    ) : (
                        <div className="alert alert-info text-center">{`No ${filterView.toLowerCase()} transaction data available for the current month.`}</div>
                    )}
                    
                    <div className="transaction-list-container">
                        <h3 className="h5 mb-3">{filterView} Transactions This Month</h3>
                        {displayTransactions.length > 0 ? (
                            displayTransactions
                                .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
                                .map(tx => (
                                    <TransactionItem
                                        key={tx.id}
                                        transaction={tx}
                                        accounts={accounts}
                                        onEdit={handleOpenModal}
                                        onDelete={handleDelete}
                                    />
                                ))
                        ) : (
                            <div className="text-center p-5 bg-white rounded shadow-sm">
                                <i className="bi bi-journal-x display-4 text-muted"></i>
                                <h4 className="mt-3">{`No ${filterView} Transactions Found`}</h4>
                                <p className="text-muted">Click "Add Transaction" to get started.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <TransactionFormModal show={isModalOpen} onClose={handleCloseModal} onSubmit={handleSaveTransaction} transactionToEdit={transactionToEdit} accounts={accounts} categories={categories} />
        </div>
    );
};

export default TransactionManagement;