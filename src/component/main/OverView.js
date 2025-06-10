// src/pages/OverviewPage.js
import React, { useState, useEffect } from 'react';
// Import các hàm service vừa tạo
import { getOverviewData, getAccountsSummary } from '../service/dashboardService';

// --- Helpers ---
const formatCurrencyVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- Component con (Tái sử dụng hoặc tạo mới) ---

const TitleGroup = ({ title, subtitle }) => (
    <div className="title-group mb-3"> 
        <h1 className="h2 mb-0">{title}</h1>
        {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
);

// Component MỚI để hiển thị các chỉ số tổng quan
const StatsGroup = ({ income, expense, netWorth }) => (
    <div className="row g-4">
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Total Income</h6>
                <h3 className="text-success mb-0">{formatCurrencyVND(income)}</h3>
            </div>
        </div>
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Total Expense</h6>
                <h3 className="text-danger mb-0">{formatCurrencyVND(expense)}</h3>
            </div>
        </div>
        <div className="col-md-4">
            <div className="custom-block bg-white text-center p-3">
                <h6 className="text-muted mb-2">Net Worth</h6>
                <h3 className="text-primary mb-0">{formatCurrencyVND(netWorth)}</h3>
            </div>
        </div>
    </div>
);

// SỬA LẠI BalanceCard để nhận dữ liệu tài khoản
const BalanceCard = ({ account }) => (
    <div className="custom-block custom-block-balance mb-4">
        <small>Balance for {account.accountName}</small>
        <h2 className="mt-2 mb-3">{formatCurrencyVND(account.balance)}</h2>
        <div className="d-flex mt-3">
            <div>
                <small>Account ID</small>
                <p className="mb-0">{account.accountId}</p>
            </div>
            <div className="ms-auto text-end">
                <small>Card Holder</small>
                {/* API không trả về tên chủ thẻ, ta có thể dùng tên tài khoản */}
                <p className="mb-0">{account.accountName}</p>
            </div>
        </div>
    </div>
);

// Các component khác giữ nguyên với dữ liệu mẫu để duy trì layout
const ChartPlaceholder = ({ id, title }) => (
    <div className="custom-block bg-white mb-4">
        {title && <h5 className="mb-4">{title}</h5>}
        <div id={id} style={{minHeight: '200px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Chart for {id}</div>
    </div>
);
const RecentTransactionsBlock = ({ transactions }) => (
    <div className="custom-block custom-block-transations mb-4">
        <h5 className="mb-4">Recent Transactions (Sample)</h5>
        {/* Giữ dữ liệu mẫu cho component này */}
        <div className="border-top pt-4 mt-4 text-center">
            <a className="btn btn-outline-primary" href="#">View all transactions <i className="bi-arrow-up-right-circle-fill ms-2"></i></a>
        </div>
    </div>
);


// --- Component chính ---

const OverviewPage = () => {
    // State để lưu dữ liệu từ API
    const [overview, setOverview] = useState(null);
    const [accounts, setAccounts] = useState([]);
    // State để quản lý loading và error
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Gọi song song 2 API để tăng tốc độ
                const [overviewData, accountsSummaryData] = await Promise.all([
                    getOverviewData(),
                    getAccountsSummary()
                ]);

                setOverview(overviewData);
                setAccounts(accountsSummaryData.accounts || []);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần khi component mount

    // --- Render giao diện ---

    if (isLoading) {
        return <div className="container text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    if (error) {
        return <div className="container mt-5"><div className="alert alert-danger">Error: {error}</div></div>;
    }

    return (
        <div className="overview-page-content container-fluid">
            <TitleGroup title="Overview" subtitle="Welcome back!" />

            {/* Hiển thị các chỉ số tổng quan */}
            {overview && (
                <StatsGroup 
                    income={overview.totalIncome}
                    expense={overview.totalExpense}
                    netWorth={overview.netWorth}
                />
            )}

            <div className="row g-4 my-4">
                <div className="col-lg-7 col-12 d-flex flex-column">
                    
                    {/* Hiển thị danh sách các tài khoản */}
                    {accounts.length > 0 ? (
                        accounts.map(acc => <BalanceCard key={acc.accountId} account={acc} />)
                    ) : (
                        <p>No accounts found.</p>
                    )}
                    
                    {/* Giữ lại các chart placeholder */}
                    <ChartPlaceholder id="history-chart" title="Spending History" />
                </div>

                <div className="col-lg-5 col-12 d-flex flex-column">
                    {/* Giữ lại các block khác với dữ liệu mẫu để duy trì layout */}
                    <RecentTransactionsBlock />
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;