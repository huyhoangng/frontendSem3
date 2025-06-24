// src/component/common/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // THÊM useNavigate

import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Image from 'react-bootstrap/Image';

// Đổi tên component thành HeaderComponent cho nhất quán nếu file là HeaderComponent.js
const HeaderComponent = ({ className }) => {
    const navigate = useNavigate(); // KHỞI TẠO useNavigate

    const notifications = [
        { id: 1, icon: "bi-check-circle-fill", iconBgClass: "bg-success", text: "Your account has been created successfuly.", time: "12 days ago", link: "#" },
        { id: 2, icon: "bi-folder", iconBgClass: "bg-info", text: "Please check. We have sent a Daily report.", time: "10 days ago", link: "#" },
        { id: 3, icon: "bi-question-circle", iconBgClass: "bg-danger", text: "Account verification failed.", time: "1 hour ago", link: "#" },
    ];
    const socialLinks = [
        { id: 1, name: "Google", img: "/images/social/search.png", link: "#" },
        { id: 2, name: "Spotify", img: "/images/social/spotify.png", link: "#" },
        { id: 3, name: "Telegram", img: "/images/social/telegram.png", link: "#" },
        { id: 4, name: "Snapchat", img: "/images/social/snapchat.png", link: "#" },
        { id: 5, name: "Tiktok", img: "/images/social/tiktok.png", link: "#" },
        { id: 6, name: "Youtube", img: "/images/social/youtube.png", link: "#" },
    ];
    const user = {
        name: "Thomas Edison",
        email: "thomas@site.com",
        avatar: "/images/medium-shot-happy-man-smiling.jpg"
    };

    const handleLogout = (e) => {
        // Không cần e.preventDefault() cho Dropdown.Item onClick
        console.log("User logging out...");

        // 1. Xóa thông tin xác thực
        localStorage.removeItem('authToken'); // Giả sử bạn lưu token ở đây
        
        navigate('/login');
    };

    return (
        <header className={`navbar sticky-top flex-md-nowrap p-0 shadow-sm bg-white ${className || ''}`}>
            <div className="col-md-3 col-lg-3 me-0 px-3 fs-6 d-flex align-items-center">
                <Link className="navbar-brand" to="/overview" style={{color: '#dc3545', fontWeight: 'bold', fontSize: '1.25rem'}}> {/* Đổi link gốc nếu cần */}
                    <i className="bi-box me-2"></i> Personal Finance
                </Link>
            </div>

            <button className="navbar-toggler position-absolute d-md-none collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <form className="custom-form header-form ms-lg-3 ms-md-3 me-lg-auto me-md-auto order-2 order-lg-0 order-md-0 d-none d-md-flex" style={{flexGrow: 1, maxWidth: '500px'}} action="#" method="get" role="form">
                <input className="form-control form-control-sm" name="search" type="text" placeholder="Search anything..." aria-label="Search" />
            </form>

            <div className="navbar-nav me-lg-2">
                <div className="nav-item text-nowrap d-flex align-items-center">

                    {/* Notifications Dropdown với React-Bootstrap */}
                    <Dropdown align="end" className="px-2">
                        <Dropdown.Toggle as={Nav.Link} id="dropdown-notifications" bsPrefix="p-0 nav-link text-center position-relative">
                            <i className="bi-bell fs-5"></i>
                            {notifications.length > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle mt-1 me-1">
                                    <span className="visually-hidden">New alerts</span>
                                </span>
                            )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="notifications-block-wrap shadow" style={{minWidth: '350px', maxHeight: '400px', overflowY: 'auto', marginTop: '0.5rem'}}>
                            <Dropdown.Header><small className="fw-bold">Notifications</small></Dropdown.Header>
                            {notifications.map((notification) => (
                                <Dropdown.Item key={notification.id} href={notification.link} className="d-flex align-items-start py-2 border-bottom">
                                    <div className={`notifications-icon-wrap ${notification.iconBgClass} me-3 p-2 rounded-circle d-flex align-items-center justify-content-center`} style={{width: '40px', height: '40px'}}>
                                        <i className={`notifications-icon ${notification.icon} text-white`} style={{fontSize: '1.1rem'}}></i>
                                    </div>
                                    <div style={{flexGrow: 1}}>
                                        <span className="d-block" style={{fontSize: '0.9rem', whiteSpace: 'normal'}}>{notification.text}</span>
                                        <p className="text-muted mb-0"><small>{notification.time}</small></p>
                                    </div>
                                </Dropdown.Item>
                            ))}
                            {notifications.length === 0 && (
                                <Dropdown.ItemText className="text-muted py-3 text-center">No new notifications</Dropdown.ItemText>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Social/App Links Dropdown với React-Bootstrap */}
                    <Dropdown align="end" className="px-2">
                        <Dropdown.Toggle as={Nav.Link} id="dropdown-social" bsPrefix="p-0 nav-link text-center">
                            <i className="bi-grid-3x3-gap-fill fs-5"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="dropdown-menu-social shadow p-3" style={{minWidth: '280px', marginTop: '0.5rem'}}>
                            <div className="container-fluid">
                                <div className="row g-3">
                                    {socialLinks.map(social => (
                                        <div key={social.id} className="col-4">
                                            <Dropdown.Item href={social.link} className="text-center p-2 d-flex flex-column align-items-center">
                                                <Image src={social.img} className="mb-1" alt={social.name} style={{width: '40px', height: '40px', objectFit: 'contain'}} />
                                                <span className="d-block small text-truncate" style={{fontSize: '0.75rem'}}>{social.name}</span>
                                            </Dropdown.Item>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Profile Dropdown với React-Bootstrap */}
                    <Dropdown align="end" className="ps-2 pe-3">
                        <Dropdown.Toggle as={Nav.Link} id="dropdown-profile" bsPrefix="p-0 d-flex align-items-center">
                            <Image src={user.avatar} roundedCircle style={{width: '36px', height: '36px', border: '2px solid #eee'}} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow" style={{marginTop: '0.5rem'}}>
                            <div className="dropdown-menu-profile-thumb d-flex p-3 align-items-center border-bottom">
                                <Image src={user.avatar} roundedCircle className="me-3" style={{width: '48px', height: '48px'}} />
                                <div className="d-flex flex-column">
                                    <span className="fw-bold" style={{fontSize: '0.95rem'}}>{user.name}</span>
                                    <a href={`mailto:${user.email}`} className="text-muted small text-decoration-none" style={{fontSize: '0.8rem'}}>{user.email}</a>
                                </div>
                            </div>
                            <Dropdown.Item as={Link} to="/profile" className="py-2">
                                <i className="bi-person me-2"></i> Profile
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} to="/setting" className="py-2"> {/* ĐỔI to="/settings" THÀNH to="/setting" CHO KHỚP VỚI APP.JS */}
                                <i className="bi-gear me-2"></i> Settings
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} to="/help-center" className="py-2"> {/* Đảm bảo có route /help-center */}
                                <i className="bi-question-circle me-2"></i> Help
                            </Dropdown.Item>
                            <div className="border-top mt-2 pt-2 mx-2">
                                {/* SỬ DỤNG onClick ĐỂ GỌI handleLogout */}
                                <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                                    <i className="bi-box-arrow-left me-2"></i> Logout
                                </Dropdown.Item>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent; 