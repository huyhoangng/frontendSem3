// src/components/InvestmentManagement.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as investmentService from '../service/investmentService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Helper Functions ---
const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const toInputDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
};

const initialFormState = {
    investmentName: '',
    investmentType: 'Stocks',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: '',
    totalInvested: '',
    currentValue: '',
    broker: '',
    accountId: ''
};

function InvestmentManagement() {
    // --- State Management ---
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentInvestment, setCurrentInvestment] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- API Call Logic ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [investmentsResponse, summaryResponse] = await Promise.all([
                investmentService.getInvestments(),
                investmentService.getInvestmentSummary()
            ]);
            
            // Validate and process investments data
            if (investmentsResponse.data) {
                const validInvestments = Array.isArray(investmentsResponse.data) 
                    ? investmentsResponse.data.filter(inv => inv && typeof inv === 'object')
                    : [];
                console.log('Fetched investments:', validInvestments); // Debug log
                setInvestments(validInvestments);
            } else {
                console.warn('No investments data received');
                setInvestments([]);
            }
            
            // Validate and process summary data
            if (summaryResponse.data) {
                console.log('Fetched summary:', summaryResponse.data); // Debug log
                setSummary(summaryResponse.data);
            } else {
                console.warn('No summary data received');
                setSummary(null);
            }
        } catch (err) {
            console.error('Error in fetchData:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load investment data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Form Handlers ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAddModal = () => {
        setCurrentInvestment(null);
        setFormData(initialFormState);
        setShowFormModal(true);
    };

    const handleOpenEditModal = (investment) => {
        console.log('Opening edit modal for investment:', investment); // Debug log
        if (!investment) {
            toast.error('No investment data provided');
            return;
        }

        // Ensure we have a valid investment object with required fields
        const validInvestment = {
            id: investment.id,
            investmentName: investment.investmentName || '',
            investmentType: investment.investmentType || 'Stocks',
            symbol: investment.symbol || '',
            quantity: investment.quantity || '',
            purchasePrice: investment.purchasePrice || '',
            currentPrice: investment.currentPrice || '',
            purchaseDate: investment.purchaseDate || '',
            totalInvested: investment.totalInvested || '',
            currentValue: investment.currentValue || '',
            broker: investment.broker || '',
            accountId: investment.accountId || ''
        };

        setCurrentInvestment(validInvestment);
        setFormData({
            ...validInvestment,
            purchaseDate: toInputDate(validInvestment.purchaseDate),
            quantity: validInvestment.quantity?.toString() || '',
            purchasePrice: validInvestment.purchasePrice?.toString() || '',
            currentPrice: validInvestment.currentPrice?.toString() || '',
            totalInvested: validInvestment.totalInvested?.toString() || '',
            currentValue: validInvestment.currentValue?.toString() || '',
            accountId: validInvestment.accountId?.toString() || ''
        });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setShowFormModal(false);
            setCurrentInvestment(null);
            setFormData(initialFormState);
            setError(null);
        }
    };

    // --- CRUD Handlers ---
    const handleSaveInvestment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate form data
            if (!formData.investmentName?.trim()) {
                throw new Error('Investment name is required');
            }
            if (!formData.purchaseDate) {
                throw new Error('Purchase date is required');
            }
            if (!formData.totalInvested || isNaN(Number(formData.totalInvested))) {
                throw new Error('Total invested amount must be a valid number');
            }
            if (!formData.currentValue || isNaN(Number(formData.currentValue))) {
                throw new Error('Current value must be a valid number');
            }

            // Prepare data for submission
            const submissionData = {
                ...formData,
                quantity: formData.quantity ? Number(formData.quantity) : 0,
                purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : 0,
                currentPrice: formData.currentPrice ? Number(formData.currentPrice) : 0,
                totalInvested: Number(formData.totalInvested),
                currentValue: Number(formData.currentValue),
                accountId: formData.accountId ? Number(formData.accountId) : null,
                purchaseDate: new Date(formData.purchaseDate).toISOString()
            };

            if (currentInvestment?.id) {
                await investmentService.updateInvestmentById(currentInvestment.id, submissionData);
                toast.success('Investment updated successfully');
            } else {
                await investmentService.addInvestment(submissionData);
                toast.success('Investment added successfully');
            }
            await fetchData();
            handleCloseModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save investment';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Error saving investment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvestment = async (id) => {
        console.log('Attempting to delete investment with ID:', id); // Debug log
        
        // Validate ID
        if (!id) {
            console.error('Invalid investment ID:', id);
            toast.error('Invalid investment ID');
            return;
        }

        // Convert ID to number if it's a string
        const numericId = Number(id);
        if (isNaN(numericId)) {
            console.error('Invalid investment ID format:', id);
            toast.error('Invalid investment ID format');
            return;
        }

        // Show confirmation dialog with more details
        const confirmed = window.confirm(
            `Are you sure you want to delete investment #${numericId}?\n\n` +
            'This action cannot be undone and all associated data will be permanently removed.'
        );

        if (confirmed) {
            try {
                setLoading(true); // Show loading state
                
                // Show loading toast
                const loadingToast = toast.loading('Deleting investment...');
                
                const response = await investmentService.deleteInvestmentById(numericId);
                
                // Dismiss loading toast
                toast.dismiss(loadingToast);
                
                // Show success message
                toast.success('Investment deleted successfully');
                
                // Refresh the data
                await fetchData();
                
            } catch (err) {
                console.error('Error deleting investment:', err);
                
                // Show error message from the service
                const errorMessage = err.message || 'Failed to delete investment';
                toast.error(errorMessage, {
                    autoClose: 5000, // Show for 5 seconds
                    position: "top-center"
                });
                
                // If it's a server error, suggest retrying
                if (errorMessage.includes('Server error')) {
                    toast.info('Please try again in a few moments', {
                        autoClose: 3000,
                        position: "top-center"
                    });
                }
            } finally {
                setLoading(false);
            }
        }
    };

    // --- Render Helpers ---
    const renderProfitLoss = (investment) => {
        if (!investment || typeof investment.currentValue !== 'number' || typeof investment.totalInvested !== 'number') {
            return <div className="text-muted">N/A</div>;
        }

        const profitLoss = investment.currentValue - investment.totalInvested;
        const profitLossPercentage = investment.totalInvested !== 0 
            ? (profitLoss / investment.totalInvested) * 100 
            : 0;
        const className = profitLoss >= 0 ? 'text-success' : 'text-danger';
        
        return (
            <div>
                <div className={className}>{formatCurrency(profitLoss)}</div>
                <small className={className}>
                    ({profitLossPercentage.toFixed(2)}%)
                </small>
            </div>
        );
    };

    // --- JSX Rendering ---
    return (
        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} />
            
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Investment Management</h1>
                <button 
                    className="btn btn-primary" 
                    onClick={handleOpenAddModal}
                    disabled={loading}
                >
                    <i className="bi bi-plus-circle me-2"></i>Add Investment
                </button>
            </div>

            {loading && (
                <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}
            
            {!loading && !error && (
                <>
                    {/* Investment Summary Cards */}
                    {summary && (
                        <>
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <div className="card text-center h-100">
                                        <div className="card-header bg-primary text-white">Total Invested</div>
                                        <div className="card-body">
                                            <h4 className="card-title">
                                                {formatCurrency(summary.totalInvested)}
                                            </h4>
                                            <small className="text-muted">Across {summary.totalInvestments} investments</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-md-3">
                                    <div className="card text-center h-100">
                                        <div className="card-header bg-info text-white">Current Value</div>
                                        <div className="card-body">
                                            <h4 className="card-title">
                                                {formatCurrency(summary.totalCurrentValue)}
                                            </h4>
                                            <small className="text-muted">Total portfolio value</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <div className={`card text-center h-100 ${
                                        summary.totalGainLoss > 0 ? 'border-success' : 
                                        summary.totalGainLoss < 0 ? 'border-danger' : ''
                                    }`}>
                                        <div className={`card-header ${
                                            summary.totalGainLoss > 0 ? 'bg-success' : 
                                            summary.totalGainLoss < 0 ? 'bg-danger' : 'bg-secondary'
                                        } text-white`}>
                                            Total Gain/Loss
                                        </div>
                                        <div className="card-body">
                                            <h4 className={`card-title ${
                                                summary.totalGainLoss > 0 ? 'text-success' : 
                                                summary.totalGainLoss < 0 ? 'text-danger' : 'text-muted'
                                            }`}>
                                                {formatCurrency(summary.totalGainLoss)}
                                            </h4>
                                            <small className={
                                                summary.totalGainLoss > 0 ? 'text-success' : 
                                                summary.totalGainLoss < 0 ? 'text-danger' : 'text-muted'
                                            }>
                                                ({summary.totalGainLossPercentage.toFixed(2)}%)
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3">
                                    <div className="card text-center h-100">
                                        <div className="card-header bg-secondary text-white">Investments by Type</div>
                                        <div className="card-body">
                                            {summary.investmentsByType.map(type => (
                                                <div key={type.investmentType} className="mb-2">
                                                    <div className="d-flex justify-content-between">
                                                        <span>{type.investmentType}</span>
                                                        <span>{type.count}</span>
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        {formatCurrency(type.totalInvested)} invested
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Investment Statistics Table */}
                            <div className="card mb-4">
                                <div className="card-header bg-dark text-white">
                                    <i className="bi bi-table me-2"></i>
                                    Investment Statistics
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Investment Type</th>
                                                    <th className="text-end">Count</th>
                                                    <th className="text-end">Total Invested</th>
                                                    <th className="text-end">Current Value</th>
                                                    <th className="text-end">Gain/Loss</th>
                                                    <th className="text-end">Gain/Loss %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary.investmentsByType.map(type => (
                                                    <tr key={type.investmentType}>
                                                        <td>{type.investmentType}</td>
                                                        <td className="text-end">{type.count}</td>
                                                        <td className="text-end">{formatCurrency(type.totalInvested)}</td>
                                                        <td className="text-end">{formatCurrency(type.totalCurrentValue)}</td>
                                                        <td className={`text-end ${
                                                            type.gainLoss > 0 ? 'text-success' : 
                                                            type.gainLoss < 0 ? 'text-danger' : ''
                                                        }`}>
                                                            {formatCurrency(type.gainLoss)}
                                                        </td>
                                                        <td className={`text-end ${
                                                            type.gainLossPercentage > 0 ? 'text-success' : 
                                                            type.gainLossPercentage < 0 ? 'text-danger' : ''
                                                        }`}>
                                                            {type.gainLossPercentage.toFixed(2)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Total Row */}
                                                <tr className="table-dark">
                                                    <td><strong>Total</strong></td>
                                                    <td className="text-end"><strong>{summary.totalInvestments}</strong></td>
                                                    <td className="text-end"><strong>{formatCurrency(summary.totalInvested)}</strong></td>
                                                    <td className="text-end"><strong>{formatCurrency(summary.totalCurrentValue)}</strong></td>
                                                    <td className={`text-end ${
                                                        summary.totalGainLoss > 0 ? 'text-success' : 
                                                        summary.totalGainLoss < 0 ? 'text-danger' : ''
                                                    }`}>
                                                        <strong>{formatCurrency(summary.totalGainLoss)}</strong>
                                                    </td>
                                                    <td className={`text-end ${
                                                        summary.totalGainLossPercentage > 0 ? 'text-success' : 
                                                        summary.totalGainLossPercentage < 0 ? 'text-danger' : ''
                                                    }`}>
                                                        <strong>{summary.totalGainLossPercentage.toFixed(2)}%</strong>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Top and Worst Performers */}
                            {summary && (summary.topPerformers.length > 0 || summary.worstPerformers.length > 0) && (
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-header bg-success text-white">
                                                <i className="bi bi-graph-up-arrow me-2"></i>
                                                Top Performers
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Symbol</th>
                                                                <th>Gain/Loss</th>
                                                                <th>%</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {summary.topPerformers.map(investment => (
                                                                <tr key={investment.investmentId}>
                                                                    <td>{investment.investmentName}</td>
                                                                    <td>{investment.symbol}</td>
                                                                    <td className="text-success">
                                                                        {formatCurrency(investment.gainLoss)}
                                                                    </td>
                                                                    <td className="text-success">
                                                                        {investment.gainLossPercentage.toFixed(2)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-header bg-danger text-white">
                                                <i className="bi bi-graph-down-arrow me-2"></i>
                                                Worst Performers
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Symbol</th>
                                                                <th>Gain/Loss</th>
                                                                <th>%</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {summary.worstPerformers.map(investment => (
                                                                <tr key={investment.investmentId}>
                                                                    <td>{investment.investmentName}</td>
                                                                    <td>{investment.symbol}</td>
                                                                    <td className="text-danger">
                                                                        {formatCurrency(investment.gainLoss)}
                                                                    </td>
                                                                    <td className="text-danger">
                                                                        {investment.gainLossPercentage.toFixed(2)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Investment Table */}
                    {investments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Investment Name</th>
                                        <th>Type</th>
                                        <th>Total Invested</th>
                                        <th>Current Value</th>
                                        <th>Profit / Loss</th>
                                        <th>Purchase Date</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {investments.map(investment => {
                                        if (!investment) {
                                            console.warn('Invalid investment data:', investment);
                                            return null;
                                        }

                                        // Log investment data for debugging
                                        console.log('Rendering investment:', investment);

                                        // Ensure we have a valid ID
                                        const investmentId = investment.id || investment.investmentId;
                                        if (!investmentId) {
                                            console.warn('Investment missing ID:', investment);
                                            return null;
                                        }

                                        return (
                                            <tr key={investmentId}>
                                                <td>
                                                    <div>{investment.investmentName || 'N/A'}</div>
                                                    {investment.symbol && (
                                                        <small className="text-muted">{investment.symbol}</small>
                                                    )}
                                                    {investment.broker && (
                                                        <small className="text-muted d-block">{investment.broker}</small>
                                                    )}
                                                </td>
                                                <td>{investment.investmentType || 'N/A'}</td>
                                                <td>{formatCurrency(investment.totalInvested)}</td>
                                                <td>{formatCurrency(investment.currentValue)}</td>
                                                <td>{renderProfitLoss(investment)}</td>
                                                <td>{formatDate(investment.purchaseDate)}</td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-warning btn-sm me-2" 
                                                        onClick={() => handleOpenEditModal(investment)} 
                                                        title="Edit"
                                                        disabled={loading}
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger btn-sm" 
                                                        onClick={() => handleDeleteInvestment(investmentId)} 
                                                        title="Delete"
                                                        disabled={loading}
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            No investments found. Start by adding your first investment.
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Form Modal */}
            {showFormModal && (
                <div className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleSaveInvestment}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {currentInvestment ? 'Edit Investment' : 'Add New Investment'}
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {error && (
                                        <div className="alert alert-danger">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            {error}
                                        </div>
                                    )}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="investmentName" className="form-label">Investment Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="investmentName" 
                                                name="investmentName" 
                                                value={formData.investmentName} 
                                                onChange={handleFormChange} 
                                                required 
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="investmentType" className="form-label">Investment Type *</label>
                                            <select 
                                                className="form-select" 
                                                id="investmentType" 
                                                name="investmentType" 
                                                value={formData.investmentType} 
                                                onChange={handleFormChange}
                                                required
                                                disabled={isSubmitting}
                                            >
                                                <option value="Stocks">Stocks</option>
                                                <option value="Bonds">Bonds</option>
                                                <option value="RealEstate">Real Estate</option>
                                                <option value="Crypto">Cryptocurrency</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="symbol" className="form-label">Symbol / Ticker</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="symbol" 
                                                name="symbol" 
                                                value={formData.symbol} 
                                                onChange={handleFormChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="broker" className="form-label">Broker / Exchange</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="broker" 
                                                name="broker" 
                                                value={formData.broker} 
                                                onChange={handleFormChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="purchaseDate" className="form-label">Purchase Date *</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="purchaseDate" 
                                                name="purchaseDate" 
                                                value={formData.purchaseDate} 
                                                onChange={handleFormChange} 
                                                required
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="quantity" className="form-label">Quantity</label>
                                            <input 
                                                type="number" 
                                                step="any" 
                                                className="form-control" 
                                                id="quantity" 
                                                name="quantity" 
                                                value={formData.quantity} 
                                                onChange={handleFormChange}
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="purchasePrice" className="form-label">Purchase Price (per unit) *</label>
                                            <input 
                                                type="number" 
                                                step="any" 
                                                className="form-control" 
                                                id="purchasePrice" 
                                                name="purchasePrice" 
                                                value={formData.purchasePrice} 
                                                onChange={handleFormChange} 
                                                required
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="currentPrice" className="form-label">Current Price (per unit)</label>
                                            <input 
                                                type="number" 
                                                step="any" 
                                                className="form-control" 
                                                id="currentPrice" 
                                                name="currentPrice" 
                                                value={formData.currentPrice} 
                                                onChange={handleFormChange}
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="totalInvested" className="form-label">Total Invested Amount *</label>
                                            <input 
                                                type="number" 
                                                step="any" 
                                                className="form-control" 
                                                id="totalInvested" 
                                                name="totalInvested" 
                                                value={formData.totalInvested} 
                                                onChange={handleFormChange} 
                                                required
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="currentValue" className="form-label">Total Current Value *</label>
                                            <input 
                                                type="number" 
                                                step="any" 
                                                className="form-control" 
                                                id="currentValue" 
                                                name="currentValue" 
                                                value={formData.currentValue} 
                                                onChange={handleFormChange} 
                                                required
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="accountId" className="form-label">Associated Account ID</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                id="accountId" 
                                                name="accountId" 
                                                value={formData.accountId} 
                                                onChange={handleFormChange}
                                                min="0"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={handleCloseModal}
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
                                            'Save Investment'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvestmentManagement;