// src/layout/AppLayout.js (Hoặc tên bạn muốn)
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../component/common/Header'; // Đường dẫn của bạn

import FooterScreen from '../component/common/Footer'; // Đường dẫn của bạn
import './ProtectLayout.css'
import SidebarScreen from '../component/common/SideBar';

const ProtectLayout = () => {
    const location = useLocation();
    // Các trang không sử dụng layout này (ví dụ: login, register)
    const noLayoutRoutes = ['/login', '/register']; // Thêm các path khác nếu cần

    if (noLayoutRoutes.some(path => location.pathname.startsWith(path))) {
        return <Outlet />; // Chỉ render nội dung trang, không có layout
    }

    // Kích thước (có thể lấy từ biến hoặc config)
    const headerHeight = 60; // Chiều cao Header (ví dụ, px)
    const sidebarWidth = 260; // Chiều rộng Sidebar (ví dụ, px) - PHẢI KHỚP VỚI CSS
    const footerHeight = 50; // Chiều cao Footer (ví dụ, px)

    return (
        <div className="app-layout-container">
            <Header
                className="app-header"
                // Nếu Header là fixed, bạn có thể cần thêm style ở đây hoặc trong CSS
                // style={{ height: `${headerHeight}px`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1030 }}
            />

            <SidebarScreen
                className="app-sidebar" // Class để style trong AppLayout.css
                style={{
                    width: `${sidebarWidth}px`,
                    // top: `${headerHeight}px`, // Nếu Header fixed, Sidebar bắt đầu dưới Header
                    // height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`, // Nếu Footer cũng fixed
                    // position: 'fixed', // QUAN TRỌNG: Để Sidebar cố định
                    // left: 0,
                }}
            />

            <main
                className="app-main-content" // Class để style trong AppLayout.css
                style={{
                    // marginLeft: `${sidebarWidth}px`, // Đẩy nội dung sang phải
                    // paddingTop: `${headerHeight}px`, // Padding trên để không bị Header che
                    // paddingBottom: `${footerHeight}px`, // Padding dưới để không bị Footer che (nếu footer fixed)
                    // minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)` // Đảm bảo nội dung đủ cao
                }}
            >
                <Outlet /> {/* Nội dung các trang con */}
            </main>

            <FooterScreen
                className="app-footer"
                // style={{
                //     marginLeft: `${sidebarWidth}px`, // Nếu Sidebar fixed
                //     height: `${footerHeight}px`,
                //     // position: 'fixed', // Nếu muốn Footer fixed
                //     // bottom: 0,
                //     // left: `${sidebarWidth}px`,
                //     // right: 0,
                // }}
            />
        </div>
    );
};

export default ProtectLayout;