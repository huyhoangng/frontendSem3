import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

// Đảm bảo bạn đã import CSS của Sidebar nếu có style riêng cho nó
// import './SidebarScreen.css'; // Nếu bạn có file CSS riêng cho Sidebar

const SidebarScreen = ({ className }) => { // <<--- NHẬN className prop
    const navigate = useNavigate();

    const menuItems = [
        { to: "/", icon: "bi-house-fill", text: "Overview" },
        { to: "/wallet", icon: "bi-wallet", text: "My Wallet" },
        { to: "/category", icon: "bi-tags-fill", text: "Danh Mục"}, 
        { to: "/profile", icon: "bi-person", text: "Profile" },
        { to: "/setting", icon: "bi-gear", text: "Settings" },
        { to: "/help-center", icon: "bi-question-circle", text: "Help Center" },
    ];

    const handleLogout = () => {
        // Xử lý logic logout thực tế (xóa token, v.v.)
        console.log("User logged out");
        navigate('/login');
    };

    // Kết hợp className từ App.js với các class cố định của Sidebar
    const sidebarClasses = `sidebar-container ${className || ''}`;

    return (
        // Bỏ các class grid col-* của Bootstrap nếu dùng position:fixed
        // Sử dụng class `sidebar-container` để dễ target hơn, và `className` được truyền từ App.js
        <nav id="sidebarMenu" className={sidebarClasses}>
            {/*
                `position-sticky` và `pt-3` có thể vẫn hữu ích cho nội dung bên trong sidebar.
                `sidebar-sticky` là class của Bootstrap template, có thể giữ lại hoặc bỏ nếu không cần.
            */}
            <div className="position-sticky pt-3 sidebar-content-wrapper"> {/* Thêm một wrapper cho nội dung */}
                {/*
                    Để mt-auto trên featured-box hoạt động, ul này cần là flex container và có chiều cao.
                    Hoặc, chúng ta có thể làm cho .sidebar-content-wrapper là flex container.
                */}
                <ul className="nav flex-column h-100"> {/* h-100 có thể cần thiết */}
                    {menuItems.map((item) => (
                        <li className="nav-item" key={item.to}>
                            <NavLink
                                className="nav-link" // Sẽ được style bởi CSS
                                to={item.to}
                                end={item.to === "/"} // Quan trọng cho "Overview"
                            >
                                <i className={`${item.icon}`}></i> {/* Bỏ me-2 nếu CSS xử lý margin */}
                                <span className="nav-link-text">{item.text}</span> {/* Bọc text trong span */}
                            </NavLink>
                        </li>
                    ))}

                    {/* Phần "Upgrade" và "Logout" sẽ được đẩy xuống cuối bằng CSS cho wrapper của chúng */}
                    <li className="nav-item sidebar-bottom-section mt-auto"> {/* mt-auto ở đây */}
                        <div className="featured-box mb-3 mx-2 text-center"> {/* text-center cho nội dung bên trong */}
                            <img
                                src="/images/credit-card.png" // Đảm bảo đường dẫn đúng
                                className="img-fluid mb-2" // Giảm margin bottom
                                alt="Upgrade to premium"
                                style={{ maxWidth: '80px' }} // Giới hạn kích thước ảnh
                            />
                            <Link className="btn btn-sm btn-danger w-100" to="/upgrade"> {/* btn-sm, btn-danger (màu đỏ) */}
                                Upgrade
                            </Link>
                        </div>

                        <div className="logout-section border-top pt-2 mx-2">
                            <button
                                className="nav-link text-start w-100"
                                onClick={handleLogout}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    // paddingLeft: '0', // CSS sẽ xử lý padding của nav-link
                                    // paddingRight: '0',
                                }}
                            >
                                <i className="bi-box-arrow-left"></i> {/* Bỏ me-2 */}
                                <span className="nav-link-text">Logout</span> {/* Bọc text */}
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default SidebarScreen;