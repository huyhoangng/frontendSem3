// src/pages/OverviewPage.js
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie } from 'react-chartjs-2';
import { getOverviewData, getAccountsSummary } from '../service/dashboardService';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

// --- Helpers ---
const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number') return '';
    const locale = currency === 'USD' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: currency 
    }).format(amount);
};

// --- Component con ---
const TitleGroup = ({ title, subtitle }) => (
    <div className="title-group mb-3"> 
        <h1 className="h2 mb-0">{title}</h1>
        {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
);

const StatsGroup = ({ income, expense, netWorth, currency = 'VND' }) => (
    <div className="row g-4">
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Total Income</h6>
                <h3 className="text-success mb-0">{formatCurrency(income, currency)}</h3>
            </div>
        </div>
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Total Expense</h6>
                <h3 className="text-danger mb-0">{formatCurrency(expense, currency)}</h3>
            </div>
        </div>
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Net Worth</h6>
                <h3 className="text-primary mb-0">{formatCurrency(netWorth, currency)}</h3>
            </div>
        </div>
    </div>
);

const BalanceCard = ({ account, isSelected }) => (
    <div className={`custom-block custom-block-balance mb-4 ${isSelected ? 'border-primary' : ''}`}>
        <small>Balance for {account.accountName}</small>
        <h2 className="mt-2 mb-3">{formatCurrency(account.balance, account.currency)}</h2>
        <div className="d-flex mt-3">
            <div><small>Account ID</small><p className="mb-0">{account.accountId}</p></div>
            <div className="ms-auto text-end"><small>Currency</small><p className="mb-0">{account.currency}</p></div>
        </div>
    </div>
);

// <<< THAY ĐỔI: Đơn giản hóa component để chỉ căn giữa ngang >>>
const IncomeExpenseChart = ({ overview, currency = 'VND' }) => {
    const total = overview.totalIncome + overview.totalExpense;

    const data = {
        labels: ['Income', 'Expense'],
        datasets: [{
            data: [overview.totalIncome, overview.totalExpense],
            backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)'],
            borderColor: ['#ffffff'],
            borderWidth: 2,
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: `Income vs Expense (${currency})`, font: { size: 16 } },
            tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw, currency)}` } },
            datalabels: {
                formatter: (value) => {
                    if (total === 0) return '0%';
                    const percentage = (value / total * 100).toFixed(1) + '%';
                    return percentage;
                },
                color: '#fff',
                font: { weight: 'bold', size: 14 }
            }
        }
    };

    return (
        <div className="custom-block bg-white p-4 h-100">
            {/* Div này để giới hạn kích thước và căn giữa bằng margin */}
            <div style={{ maxWidth: '350px', margin: '0 auto', position: 'relative' }}>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
};

// --- Component chính ---
const OverviewPage = () => {
    const [overview, setOverview] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null);

    const getSelectedCurrency = () => {
        if (selectedAccountId) {
            const selectedAccount = accounts.find(acc => acc.accountId === selectedAccountId);
            return selectedAccount?.currency || 'USD';
        }
        return accounts[0]?.currency || 'USD';
    };

    const calculateTotalBalance = (accounts, currency) => {
        return accounts.reduce((total, account) => total + (account.currency === currency ? account.balance : 0), 0);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [overviewData, accountsSummaryData] = await Promise.all([
                    getOverviewData(),
                    getAccountsSummary(),
                ]);

                setOverview(overviewData);
                const accountsData = accountsSummaryData.accounts || [];
                setAccounts(accountsData);
                
                if (accountsData.length > 0 && !selectedAccountId) {
                    setSelectedAccountId(accountsData[0].accountId);
                }
            } catch (err) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    if (isLoading) {
        return <div className="container text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    if (error) {
        return <div className="container mt-5"><div className="alert alert-danger">Error: {error}</div></div>;
    }

    const selectedCurrency = getSelectedCurrency();
    const totalBalance = calculateTotalBalance(accounts, selectedCurrency);

    return (
        <div className="overview-page-content container-fluid">
            <TitleGroup title="Overview" subtitle="Welcome back!" />

            {overview && (
                <StatsGroup 
                    income={overview.totalIncome}
                    expense={overview.totalExpense}
                    netWorth={totalBalance}
                    currency={selectedCurrency}
                />
            )}
            
            <div className="row g-4 my-4">
                <div className="col-lg-7">
                    {overview && (
                        <IncomeExpenseChart overview={overview} currency={selectedCurrency} />
                    )}
                </div>
                <div className="col-lg-5 d-flex flex-column">
                    <select 
                        className="form-select mb-4"
                        value={selectedAccountId || ''}
                        onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                    >
                        {accounts.map(account => (
                            <option key={account.accountId} value={account.accountId}>
                                {account.accountName} ({account.currency})
                            </option>
                        ))}
                    </select>

                    {accounts.length > 0 ? (
                        accounts.map(acc => (
                            <BalanceCard 
                                key={acc.accountId} 
                                account={acc}
                                isSelected={acc.accountId === selectedAccountId}
                            />
                        ))
                    ) : (
                        <p>No accounts found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;