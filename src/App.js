// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

import HeaderComponent from './component/common/Header';
import SidebarComponent from './component/common/SideBar';
import FooterComponent from './component/common/Footer';

import MainPage from './page/MainPage';
import LoginPage from './page/LoginPage';
import CategoryPage from './page/CategoryPage';
import WalletPage from './page/WalletPage';
import SettingsPage from './page/SettingPage';
import ProfilePage from './page/ProfilePage';
import RegisterPage from './page/RegisterPage';
import TransactionsPage from './page/TransactionPage';
import GoalsPage from './page/GoalsPage';
import BudgetPage from './page/BudgetPage';
import DebtsPage from './page/Debtspage';
import InvestmentPage from './page/InvestmentPage';
import LoanPage from './page/LoanPage';
import PostPage from './page/PostPage';

const MainLayout = () => {
    const location = useLocation();
    const noLayoutRoutes = ['/login', '/register'];

    const isAuthenticated = !!localStorage.getItem('authToken');
    // Nếu không xác thực VÀ đang cố truy cập route cần layout (không phải login/register)
    // thì chuyển hướng về login.
    // Logic này vẫn cần thiết để bảo vệ các route bên trong MainLayout nếu người dùng gõ URL trực tiếp.
    if (!isAuthenticated && !noLayoutRoutes.includes(location.pathname)) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="app-layout-wrapper">
            <HeaderComponent className="app-header-fixed" />
            <SidebarComponent className="sidebar-container" />
            <main role="main" className="app-main-content-area">
                <Outlet />
            </main>
            <FooterComponent className="app-footer-area" />
        </div>
    );
};

// Component để LUÔN LUÔN chuyển hướng đến trang login khi vào trang gốc
const RootRedirect = () => {
    // Không cần kiểm tra isAuthenticated ở đây nữa nếu yêu cầu là luôn vào login
    return <Navigate to="/login" replace />;
};


function App() {
    return (
        <Router>
            <Routes>
                {/* Route cho trang gốc, LUÔN LUÔN điều hướng đến /login */}
                <Route path="/" element={<RootRedirect />} />

                {/* Các route không dùng MainLayout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Thêm /forgot-password hoặc các trang công khai khác ở đây */}


                {/* Các route sử dụng MainLayout (vẫn được bảo vệ bởi logic trong MainLayout) */}
                <Route element={<MainLayout />}>
                    <Route path="/overview" element={<MainPage />} />
                    <Route path="/category" element={<CategoryPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/setting" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/budgets" element={<BudgetPage />} />
                    <Route path="/debts" element={<DebtsPage />} />
                    <Route path="/investment" element={<InvestmentPage />} />
                    <Route path="/loans" element={<LoanPage />} />
                    <Route path="/posts" element={<PostPage />} />
                </Route>

                {/*
                  Fallback route: Nếu không có route nào khớp, chuyển hướng về trang gốc.
                  RootRedirect sẽ lại xử lý và chuyển đến /login.
                */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
    );
}

export default App;