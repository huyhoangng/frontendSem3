// src/components/InvestmentManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import * as investmentService from '../service/investmentService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Helper Functions ---
const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const toInputDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toISOString().split('T')[0];
};

const initialFormState = {
    investmentName: '', investmentType: 'Stocks', symbol: '', quantity: '', purchasePrice: '',
    currentPrice: '', purchaseDate: toInputDate(new Date()), totalInvested: '', currentValue: '', broker: '', accountId: ''
};

// --- Investment Form Modal ---
const InvestmentFormModal = ({ show, onClose, onSubmit, currentInvestment, accounts = [], isSubmitting }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (currentInvestment) {
            setFormData({
                ...initialFormState, // Bắt đầu với state rỗng để tránh lỗi null
                ...currentInvestment, // Ghi đè bằng dữ liệu hiện tại
                purchaseDate: toInputDate(currentInvestment.purchaseDate),
                accountId: currentInvestment.accountId?.toString() || ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [currentInvestment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Validation cơ bản
        if (!formData.investmentName || !formData.purchasePrice || !formData.totalInvested || !formData.currentValue || !formData.accountId) {
            setFormError('Please fill in all required fields (*).');
            return;
        }
        setFormError(null);
        onSubmit(e, formData); // Truyền sự kiện và dữ liệu form đi
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleFormSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{currentInvestment ? 'Edit Investment' : 'Add New Investment'}</h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting}></button>
                        </div>
                        <div className="modal-body">
                            {formError && (<div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{formError}</div>)}
                            <div className="row">
                                <div className="col-md-6 mb-3"><label htmlFor="investmentName" className="form-label">Investment Name *</label><input type="text" className="form-control" id="investmentName" name="investmentName" value={formData.investmentName} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="investmentType" className="form-label">Investment Type *</label><select className="form-select" id="investmentType" name="investmentType" value={formData.investmentType} onChange={handleChange} required disabled={isSubmitting}><option value="Stocks">Stocks</option><option value="Bonds">Bonds</option><option value="RealEstate">Real Estate</option><option value="Crypto">Cryptocurrency</option><option value="Other">Other</option></select></div>
                                <div className="col-md-6 mb-3"><label htmlFor="symbol" className="form-label">Symbol / Ticker</label><input type="text" className="form-control" id="symbol" name="symbol" value={formData.symbol} onChange={handleChange} disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="broker" className="form-label">Broker / Exchange</label><input type="text" className="form-control" id="broker" name="broker" value={formData.broker} onChange={handleChange} disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="purchaseDate" className="form-label">Purchase Date *</label><input type="date" className="form-control" id="purchaseDate" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="quantity" className="form-label">Quantity</label><input type="number" step="any" className="form-control" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="0" disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="purchasePrice" className="form-label">Purchase Price (per unit) *</label><input type="number" step="any" className="form-control" id="purchasePrice" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} required min="0" disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="currentPrice" className="form-label">Current Price (per unit) *</label><input type="number" step="any" className="form-control" id="currentPrice" name="currentPrice" value={formData.currentPrice} onChange={handleChange} required min="0" disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="totalInvested" className="form-label">Total Invested Amount *</label><input type="number" step="any" className="form-control" id="totalInvested" name="totalInvested" value={formData.totalInvested} onChange={handleChange} required min="0" disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3"><label htmlFor="currentValue" className="form-label">Total Current Value *</label><input type="number" step="any" className="form-control" id="currentValue" name="currentValue" value={formData.currentValue} onChange={handleChange} required min="0" disabled={isSubmitting}/></div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="accountId" className="form-label">Associated Account *</label>
                                    <select className="form-select" id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required disabled={isSubmitting}>
                                        <option value="">-- Select an Account --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.accountId} value={acc.accountId}>
                                                {acc.accountName} ({formatCurrency(acc.balance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? (<><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>) : ('Save Investment')}</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
function InvestmentManagement() {
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentInvestment, setCurrentInvestment] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [marketData, setMarketData] = useState([]);
    const [marketLoading, setMarketLoading] = useState(true);
    const [marketError, setMarketError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [investmentsResponse, summaryResponse, accountsResponse] = await Promise.all([
                investmentService.getInvestments(),
                investmentService.getInvestmentSummary(),
                investmentService.getAccounts()
            ]);
            setInvestments(investmentsResponse.data || []);
            setSummary(summaryResponse.data || null);
            setAccounts(accountsResponse.data || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load personal data';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, []);

    const fetchMarketData = useCallback(async () => {
        try {
            setMarketError(null);
            const allTickersResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
            const top6ByVolume = allTickersResponse.data
                .filter(ticker => ticker.symbol.endsWith('USDT') && parseFloat(ticker.quoteVolume) > 10000000)
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 6);

            const weeklyDataPromises = top6ByVolume.map(ticker => 
                axios.get('https://api.binance.com/api/v3/klines', {
                    params: { symbol: ticker.symbol, interval: '1d', limit: 8 }
                })
            );
            const weeklyDataResponses = await Promise.all(weeklyDataPromises);

            const combinedData = top6ByVolume.map((ticker, index) => {
                const klines = weeklyDataResponses[index].data;
                const prices = klines.map(kline => parseFloat(kline[4])); 
                return { symbol: ticker.symbol, prices: prices };
            });
            
            setMarketData(combinedData);
        } catch (err) {
            setMarketError("Could not load market data from Binance.");
            console.error("Error fetching Binance market data:", err);
        }
    }, []);
    
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            setMarketLoading(true);
            await Promise.all([fetchData(), fetchMarketData()]);
            setLoading(false);
            setMarketLoading(false);
        };
        loadAllData();
    }, [fetchData, fetchMarketData]);

    const handleOpenAddModal = () => {
        setCurrentInvestment(null);
        setShowFormModal(true);
    };

    const handleOpenEditModal = (investment) => {
        setCurrentInvestment(investment);
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setShowFormModal(false);
            setCurrentInvestment(null);
            setError(null);
        }
    };

    const handleSaveInvestment = async (e, formData) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
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

            if (currentInvestment && currentInvestment.id) {
                await investmentService.updateInvestment(currentInvestment.id, submissionData);
                toast.success('Investment updated successfully');
            } else {
                await investmentService.addInvestment(submissionData);
                toast.success('Investment added successfully');
            }
            await fetchData();
            handleCloseModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save investment';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvestment = async (id) => {
        if (window.confirm(`Are you sure you want to delete this investment?`)) {
            const loadingToast = toast.loading('Deleting investment...');
            try {
                await investmentService.deleteInvestment(Number(id));
                toast.dismiss(loadingToast);
                toast.success('Investment deleted successfully');
                await fetchData();
            } catch (err) {
                toast.dismiss(loadingToast);
                toast.error(err.response?.data?.message || 'Failed to delete investment');
            }
        }
    };

    const renderProfitLoss = (investment) => {
        const profitLoss = (investment.currentValue || 0) - (investment.totalInvested || 0);
        const profitLossPercentage = investment.totalInvested ? (profitLoss / investment.totalInvested) * 100 : 0;
        const className = profitLoss >= 0 ? 'text-success' : 'text-danger';
        return (<div><div className={className}>{formatCurrency(profitLoss)}</div><small className={className}>({profitLossPercentage.toFixed(2)}%)</small></div>);
    };

    const getChartOptions = (coinSymbol) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, text: `${coinSymbol.replace('USDT', '')} - 7 Day Trend`, font: { size: 14 }, color: '#f8f9fa' }, tooltip: {} },
        scales: { y: { ticks: { color: 'rgba(255, 255, 255, 0.7)', callback: (value) => '$' + value.toLocaleString() }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, x: { ticks: { display: false }, grid: { color: 'rgba(255, 255, 255, 0.1)' } } }
    });

    const getChartData = (coin) => {
        const priceChange = ((coin.prices[7] - coin.prices[0]) / coin.prices[0]) * 100;
        const color = priceChange >= 0 ? 'rgba(25, 135, 84, 1)' : 'rgba(220, 53, 69, 1)';
        const bgColor = priceChange >= 0 ? 'rgba(25, 135, 84, 0.2)' : 'rgba(220, 53, 69, 0.2)';
        return { labels: ['', '', '', '', '', '', '', ''], datasets: [{ label: coin.symbol.replace('USDT', ''), data: coin.prices, borderColor: color, backgroundColor: bgColor, fill: true, tension: 0.4, pointRadius: 0 }] };
    };

    return (
        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="d-flex justify-content-between align-items-center mb-3"><h1>Investment Management</h1><button className="btn btn-primary" onClick={handleOpenAddModal} disabled={loading}><i className="bi bi-plus-circle me-2"></i>Add Investment</button></div>
            {(loading) && (<div className="text-center my-4"><div className="spinner-border text-primary"></div></div>)}
            {error && !showFormModal && (<div className="alert alert-danger">{error}</div>)}
            {!loading && (
                <>
                    <h2 className="h4 mb-3">Market Movers (Top 6 by Volume)</h2>
                    <div className="row g-3 mb-4">
                        {marketLoading ? ( <div className="col-12 text-center p-5"><div className="spinner-border text-secondary"></div></div> ) : 
                         marketError ? ( <div className="col-12"><div className="alert alert-warning m-0">{marketError}</div></div> ) : 
                         (marketData.map(coin => (<div key={coin.symbol} className="col-12 col-md-6 col-xl-4"><div className="card bg-dark text-light h-100"><div className="card-body"><div style={{ height: '250px' }}><Line options={getChartOptions(coin.symbol)} data={getChartData(coin)} /></div></div></div></div>)))}
                    </div>
                    
                    {summary && (
                        <div className="row mb-4">
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-primary text-white">Total Invested</div><div className="card-body"><h4 className="card-title">{formatCurrency(summary.totalInvested)}</h4></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-info text-white">Current Value</div><div className="card-body"><h4 className="card-title">{formatCurrency(summary.totalCurrentValue)}</h4></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className={`card text-center h-100 shadow-sm ${summary.totalGainLoss >= 0 ? 'border-success' : 'border-danger'}`}><div className={`card-header ${summary.totalGainLoss >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>Total Gain/Loss</div><div className="card-body"><h4 className={`card-title ${summary.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(summary.totalGainLoss)}</h4></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-secondary text-white">Investments by Type</div><div className="card-body p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>{summary.investmentsByType?.map(type => (<div key={type.investmentType} className="mb-2"><div className="d-flex justify-content-between px-2"><span>{type.investmentType}</span><span>{type.count}</span></div><small className="text-muted d-block">{formatCurrency(type.totalInvested)} invested</small></div>))}</div></div></div>
                        </div>
                    )}
                    
                    {investments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle">
                                <thead className="table-dark"><tr><th>Investment Name</th><th>Type</th><th>Total Invested</th><th>Current Value</th><th>Profit / Loss</th><th>Purchase Date</th><th className="text-center">Actions</th></tr></thead>
                                <tbody>{investments.map(investment => (<tr key={investment.id}><td><div>{investment.investmentName}</div>{investment.symbol && (<small className="text-muted">{investment.symbol}</small>)}</td><td>{investment.investmentType}</td><td>{formatCurrency(investment.totalInvested)}</td><td>{formatCurrency(investment.currentValue)}</td><td>{renderProfitLoss(investment)}</td><td>{formatDate(investment.purchaseDate)}</td><td className="text-center"><button className="btn btn-warning btn-sm me-2" onClick={() => handleOpenEditModal(investment)} title="Edit"><i className="bi bi-pencil-square"></i></button><button className="btn btn-danger btn-sm" onClick={() => handleDeleteInvestment(investment.id)} title="Delete"><i className="bi bi-trash3"></i></button></td></tr>))}</tbody>
                            </table>
                        </div>
                    ) : ( <div className="alert alert-info"><i className="bi bi-info-circle me-2"></i>No personal investments found. Start by adding one.</div>)}
                </>
            )}
            
            <InvestmentFormModal show={showFormModal} onClose={handleCloseModal} onSubmit={handleSaveInvestment} currentInvestment={currentInvestment} accounts={accounts} isSubmitting={isSubmitting} />
        </div>
    );
}

export default InvestmentManagement;