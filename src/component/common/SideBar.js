import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const SidebarScreen = ({ className }) => {
    const navigate = useNavigate();
    const [openSubmenuKey, setOpenSubmenuKey] = useState(null);

    // <<< THAY ĐỔI: Thêm "Posts" vào đây >>>
    const menuItems = [
        { to: "/overview", icon: "bi-house-fill", text: "Overview" },
        { to: "/wallet", icon: "bi-wallet2", text: "My Account" },
        { to: "/category", icon: "bi-tags-fill", text: "Categories" },
        { to: "/posts", icon: "bi-file-post", text: "Posts" }, // Mục mới đã được thêm
    ];

    // Structure for dropdown menus (đã xóa Posts khỏi đây)
    const dropdownMenus = [
        {
            key: 'pagesManagement',
            icon: "bi-folder-fill",
            text: "Services",
            children: [
                { header: "Website Content:" },
                { to: "/budgets", text: "Budget" },
                { to: "/goals", text: "Goals" },
                { to: "/transactions", text: "Transactions" },
                { to: "/debts", text: "Debts" },
                { to: "/investment", text: "Investment" },
                { to: "/loans", text: "Loan" },
            ]
        },
    ];

    
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    const toggleSubmenu = (key) => {
        setOpenSubmenuKey(openSubmenuKey === key ? null : key);
    };

    const sidebarClasses = `sidebar-container bg-white shadow-sm ${className || ''}`;

    return (
        <nav id="sidebarMenu" className={sidebarClasses}>
            <div className="sidebar-content-wrapper pt-3">
                <ul className="nav flex-column">
                    {/* Single menu items */}
                    {menuItems.map((item) => (
                        <li className="nav-item" key={item.to}>
                            <NavLink
                                className="nav-link d-flex align-items-center"
                                to={item.to}
                                end={item.to === "/overview"}
                            >
                                <i className={`${item.icon} sidebar-icon me-2`}></i>
                                <span className="nav-link-text">{item.text}</span>
                            </NavLink>
                        </li>
                    ))}

                    {/* Dropdown menus */}
                    {dropdownMenus.map((menu) => (
                        <li className="nav-item" key={menu.key}>
                            <a
                                className={`nav-link d-flex align-items-center justify-content-between ${openSubmenuKey === menu.key ? '' : 'collapsed'}`}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleSubmenu(menu.key);
                                }}
                                aria-expanded={openSubmenuKey === menu.key}
                                aria-controls={`collapse-${menu.key}`}
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse-${menu.key}`}
                            >
                                <div>
                                    <i className={`${menu.icon} sidebar-icon me-2`}></i>
                                    <span className="nav-link-text">{menu.text}</span>
                                </div>
                                <i className={`bi ${openSubmenuKey === menu.key ? 'bi-chevron-down' : 'bi-chevron-right'} ms-auto sidebar-icon-toggle`}></i>
                            </a>
                            <div
                                className={`collapse submenu-collapse ${openSubmenuKey === menu.key ? 'show' : ''}`}
                                id={`collapse-${menu.key}`}
                            >
                                <div className="py-2 collapse-inner rounded my-1 ms-3">
                                    {menu.children.map((child, childIndex) => (
                                        child.header ? (
                                            <h6 className="collapse-header px-3 mt-2 mb-1 text-uppercase small" key={`${menu.key}-header-${childIndex}`}>
                                                {child.header}
                                            </h6>
                                        ) : child.divider ? (
                                            <hr className="my-1 mx-3" key={`${menu.key}-divider-${childIndex}`} />
                                        ) : (
                                            <Link
                                                className="collapse-item d-block px-3 py-2"
                                                to={child.to}
                                                key={child.to}
                                                onClick={() => setOpenSubmenuKey(null)}
                                            >
                                                {child.text}
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                <ul className="nav flex-column sidebar-bottom-section mt-auto">
                    <li className="nav-item logout-section border-top pt-2 mx-2 mt-2">
                        <button
                            className="nav-link text-start w-100 d-flex align-items-center"
                            onClick={handleLogout}
                            style={{ border: 'none', background: 'transparent' }}
                        >
                            <i className="bi-box-arrow-left sidebar-icon me-2"></i>
                            <span className="nav-link-text">Logout</span>
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default SidebarScreen;