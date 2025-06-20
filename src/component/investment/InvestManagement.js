// src/components/InvestmentManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import * as investmentService from '../service/investmentService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// Import các thành phần cần thiết từ thư viện biểu đồ
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Đăng ký các thành phần với Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
    currentPrice: '', purchaseDate: '', totalInvested: '', currentValue: '', broker: '', accountId: ''
};

function InvestmentManagement() {
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentInvestment, setCurrentInvestment] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [marketData, setMarketData] = useState([]);
    const [marketLoading, setMarketLoading] = useState(true);
    const [marketError, setMarketError] = useState(null);

    const fetchPersonalData = useCallback(async () => {
        try {
            const [investmentsResponse, summaryResponse] = await Promise.all([
                investmentService.getInvestments(),
                investmentService.getInvestmentSummary()
            ]);
            setInvestments(investmentsResponse.data || []);
            setSummary(summaryResponse.data || null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load personal investment data';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, []);

    const fetchMarketData = useCallback(async () => {
        try {
            setMarketError(null);
            const allTickersResponse = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
            
            // <<< THAY ĐỔI DUY NHẤT Ở ĐÂY: Đổi từ 5 thành 6 >>>
            const top6ByVolume = allTickersResponse.data
                .filter(ticker => ticker.symbol.endsWith('USDT') && parseFloat(ticker.quoteVolume) > 10000000)
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 6); // Lấy 6 mã thay vì 5

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
            await Promise.all([fetchPersonalData(), fetchMarketData()]);
            setLoading(false);
            setMarketLoading(false);
        };
        loadAllData();
    }, [fetchPersonalData, fetchMarketData]);

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
        if (!investment) { toast.error('No investment data provided'); return; }
        const investmentId = investment.investmentId || investment.id;
        const validInvestment = {
            id: investmentId, investmentName: investment.investmentName || '', investmentType: investment.investmentType || 'Stocks',
            symbol: investment.symbol || '', quantity: investment.quantity || '', purchasePrice: investment.purchasePrice || '',
            currentPrice: investment.currentPrice || '', purchaseDate: investment.purchaseDate || '', totalInvested: investment.totalInvested || '',
            currentValue: investment.currentValue || '', broker: investment.broker || '', accountId: investment.accountId || ''
        };
        setCurrentInvestment(validInvestment);
        setFormData({
            ...validInvestment,
            purchaseDate: toInputDate(validInvestment.purchaseDate),
            quantity: String(validInvestment.quantity || ''), purchasePrice: String(validInvestment.purchasePrice || ''),
            currentPrice: String(validInvestment.currentPrice || ''), totalInvested: String(validInvestment.totalInvested || ''),
            currentValue: String(validInvestment.currentValue || ''), accountId: String(validInvestment.accountId || '')
        });
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setShowFormModal(false); setCurrentInvestment(null);
            setFormData(initialFormState); setError(null);
        }
    };

    const handleSaveInvestment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const submissionData = {
                ...formData,
                quantity: formData.quantity ? Number(formData.quantity) : 0, purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : 0,
                currentPrice: formData.currentPrice ? Number(formData.currentPrice) : 0, totalInvested: Number(formData.totalInvested),
                currentValue: Number(formData.currentValue), accountId: formData.accountId ? Number(formData.accountId) : null,
                purchaseDate: new Date(formData.purchaseDate).toISOString()
            };
            if (currentInvestment && currentInvestment.id) {
                await investmentService.updateInvestment(currentInvestment.id, submissionData);
                toast.success('Investment updated successfully');
            } else {
                await investmentService.addInvestment(submissionData);
                toast.success('Investment added successfully');
            }
            await fetchPersonalData();
            handleCloseModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save investment';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvestment = async (id) => {
        if (!id) { toast.error('Invalid investment ID'); return; }
        const numericId = Number(id);
        if (isNaN(numericId)) { toast.error('Invalid investment ID format'); return; }
        const confirmed = window.confirm(`Are you sure you want to delete investment #${numericId}?`);
        if (confirmed) {
            const loadingToast = toast.loading('Deleting investment...');
            try {
                await investmentService.deleteInvestment(numericId);
                toast.dismiss(loadingToast);
                toast.success('Investment deleted successfully');
                await fetchPersonalData();
            } catch (err) {
                toast.dismiss(loadingToast);
                const errorMessage = err.response?.data?.message || 'Failed to delete investment';
                toast.error(errorMessage);
            }
        }
    };

    const renderProfitLoss = (investment) => {
        if (!investment || typeof investment.currentValue !== 'number' || typeof investment.totalInvested !== 'number') return <div className="text-muted">N/A</div>;
        const profitLoss = investment.currentValue - investment.totalInvested;
        const profitLossPercentage = investment.totalInvested !== 0 ? (profitLoss / investment.totalInvested) * 100 : 0;
        const className = profitLoss >= 0 ? 'text-success' : 'text-danger';
        return (<div><div className={className}>{formatCurrency(profitLoss)}</div><small className={className}>({profitLossPercentage.toFixed(2)}%)</small></div>);
    };

    const getChartOptions = (coinSymbol) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true, text: `${coinSymbol.replace('USDT', '')} - 7 Day Trend`,
                font: { size: 14 }, color: '#f8f9fa'
            },
            tooltip: {}
        },
        scales: {
            y: { ticks: { color: 'rgba(255, 255, 255, 0.7)', callback: (value) => '$' + value.toLocaleString() }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            x: { ticks: { display: false }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        }
    });

    const getChartData = (coin) => {
        const priceChange = ((coin.prices[7] - coin.prices[0]) / coin.prices[0]) * 100;
        const color = priceChange >= 0 ? 'rgba(25, 135, 84, 1)' : 'rgba(220, 53, 69, 1)';
        const bgColor = priceChange >= 0 ? 'rgba(25, 135, 84, 0.2)' : 'rgba(220, 53, 69, 0.2)';

        return {
            labels: ['', '', '', '', '', '', '', ''],
            datasets: [{
                label: coin.symbol.replace('USDT', ''), data: coin.prices,
                borderColor: color, backgroundColor: bgColor, fill: true,
                tension: 0.4, pointRadius: 0,
            }],
        };
    };

    return (
        <div className="container mt-4">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="d-flex justify-content-between align-items-center mb-3"><h1>Investment Management</h1><button className="btn btn-primary" onClick={handleOpenAddModal} disabled={loading}><i className="bi bi-plus-circle me-2"></i>Add Investment</button></div>
            {(loading) && (<div className="text-center my-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>)}
            {error && !showFormModal && (<div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>)}
            {!loading && (
                <>
                    <h2 className="h4 mb-3">Market Movers (Top 6 by Volume)</h2>
                    <div className="row g-3 mb-4">
                        {marketLoading ? (
                            <div className="col-12 text-center p-5"><div className="spinner-border text-secondary"></div><p className="mt-2 text-muted">Loading Market Data...</p></div>
                        ) : marketError ? (
                            <div className="col-12"><div className="alert alert-warning m-0">{marketError}</div></div>
                        ) : (
                            marketData.map(coin => (
                                <div key={coin.symbol} className="col-12 col-md-6 col-xl-4">
                                    <div className="card bg-dark text-light h-100">
                                        <div className="card-body">
                                            <div style={{ height: '250px' }}>
                                                <Line options={getChartOptions(coin.symbol)} data={getChartData(coin)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {summary && (
                        <div className="row mb-4">
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-primary text-white">Total Invested</div><div className="card-body"><h4 className="card-title">{formatCurrency(summary.totalInvested)}</h4><small className="text-muted">Across {summary.totalInvestments} investments</small></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-info text-white">Current Value</div><div className="card-body"><h4 className="card-title">{formatCurrency(summary.totalCurrentValue)}</h4><small className="text-muted">Total portfolio value</small></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className={`card text-center h-100 shadow-sm ${summary.totalGainLoss > 0 ? 'border-success' : summary.totalGainLoss < 0 ? 'border-danger' : ''}`}><div className={`card-header ${summary.totalGainLoss > 0 ? 'bg-success' : summary.totalGainLoss < 0 ? 'bg-danger' : 'bg-secondary'} text-white`}>Total Gain/Loss</div><div className="card-body"><h4 className={`card-title ${summary.totalGainLoss > 0 ? 'text-success' : summary.totalGainLoss < 0 ? 'text-danger' : 'text-muted'}`}>{formatCurrency(summary.totalGainLoss)}</h4><small className={`${summary.totalGainLoss > 0 ? 'text-success' : summary.totalGainLoss < 0 ? 'text-danger' : 'text-muted'}`}>({summary.totalGainLossPercentage?.toFixed(2)}%)</small></div></div></div>
                            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-center h-100 shadow-sm"><div className="card-header bg-secondary text-white">Investments by Type</div><div className="card-body p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>{summary.investmentsByType?.map(type => (<div key={type.investmentType} className="mb-2"><div className="d-flex justify-content-between px-2"><span>{type.investmentType}</span><span>{type.count}</span></div><small className="text-muted d-block">{formatCurrency(type.totalInvested)} invested</small></div>))}</div></div></div>
                        </div>
                    )}
                    
                    {investments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle">
                                <thead className="table-dark"><tr><th>Investment Name</th><th>Type</th><th>Total Invested</th><th>Current Value</th><th>Profit / Loss</th><th>Purchase Date</th><th className="text-center">Actions</th></tr></thead>
                                <tbody>
                                    {investments.map(investment => { const investmentId = investment.investmentId || investment.id; if (!investmentId) return null; return (<tr key={investmentId}><td><div>{investment.investmentName || 'N/A'}</div>{investment.symbol && (<small className="text-muted">{investment.symbol}</small>)}{investment.broker && (<small className="text-muted d-block">{investment.broker}</small>)}</td><td>{investment.investmentType || 'N/A'}</td><td>{formatCurrency(investment.totalInvested)}</td><td>{formatCurrency(investment.currentValue)}</td><td>{renderProfitLoss(investment)}</td><td>{formatDate(investment.purchaseDate)}</td><td className="text-center"><button className="btn btn-warning btn-sm me-2" onClick={() => handleOpenEditModal(investment)} title="Edit" disabled={loading}><i className="bi bi-pencil-square"></i></button><button className="btn btn-danger btn-sm" onClick={() => handleDeleteInvestment(investmentId)} title="Delete" disabled={loading}><i className="bi bi-trash3"></i></button></td></tr>);})}
                                </tbody>
                            </table>
                        </div>
                    ) : ( <div className="alert alert-info"><i className="bi bi-info-circle me-2"></i>No personal investments found. Start by adding one.</div>)}
                </>
            )}
            
            {showFormModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleSaveInvestment}>
                                <div className="modal-header"><h5 className="modal-title">{currentInvestment ? 'Edit Investment' : 'Add New Investment'}</h5><button type="button" className="btn-close" onClick={handleCloseModal} disabled={isSubmitting}></button></div>
                                <div className="modal-body">
                                    {error && (<div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>)}
                                    <div className="row">
                                        <div className="col-md-6 mb-3"><label htmlFor="investmentName" className="form-label">Investment Name *</label><input type="text" className="form-control" id="investmentName" name="investmentName" value={formData.investmentName} onChange={handleFormChange} required disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="investmentType" className="form-label">Investment Type *</label><select className="form-select" id="investmentType" name="investmentType" value={formData.investmentType} onChange={handleFormChange} required disabled={isSubmitting}><option value="Stocks">Stocks</option><option value="Bonds">Bonds</option><option value="RealEstate">Real Estate</option><option value="Crypto">Cryptocurrency</option><option value="Other">Other</option></select></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="symbol" className="form-label">Symbol / Ticker</label><input type="text" className="form-control" id="symbol" name="symbol" value={formData.symbol} onChange={handleFormChange} disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="broker" className="form-label">Broker / Exchange</label><input type="text" className="form-control" id="broker" name="broker" value={formData.broker} onChange={handleFormChange} disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="purchaseDate" className="form-label">Purchase Date *</label><input type="date" className="form-control" id="purchaseDate" name="purchaseDate" value={formData.purchaseDate} onChange={handleFormChange} required disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="quantity" className="form-label">Quantity</label><input type="number" step="any" className="form-control" id="quantity" name="quantity" value={formData.quantity} onChange={handleFormChange} min="0" disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="purchasePrice" className="form-label">Purchase Price (per unit) *</label><input type="number" step="any" className="form-control" id="purchasePrice" name="purchasePrice" value={formData.purchasePrice} onChange={handleFormChange} required min="0" disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="currentPrice" className="form-label">Current Price (per unit)</label><input type="number" step="any" className="form-control" id="currentPrice" name="currentPrice" value={formData.currentPrice} onChange={handleFormChange} min="0" disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="totalInvested" className="form-label">Total Invested Amount *</label><input type="number" step="any" className="form-control" id="totalInvested" name="totalInvested" value={formData.totalInvested} onChange={handleFormChange} required min="0" disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="currentValue" className="form-label">Total Current Value *</label><input type="number" step="any" className="form-control" id="currentValue" name="currentValue" value={formData.currentValue} onChange={handleFormChange} required min="0" disabled={isSubmitting}/></div>
                                        <div className="col-md-6 mb-3"><label htmlFor="accountId" className="form-label">Associated Account ID</label><input type="number" className="form-control" id="accountId" name="accountId" value={formData.accountId} onChange={handleFormChange} min="0" disabled={isSubmitting}/></div>
                                    </div>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>) : ('Save Investment')}</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvestmentManagement;