// src/pages/SettingsPage.js
import React, { useState } from 'react';
import ProfileSettings from '../component/settings/ProfileSetting';
import PasswordSettings from '../component/settings/PasswordSetting';
import NotificationSettings from '../component/settings/NotificationSetting';


// Component TitleGroup (có thể đặt ở file riêng hoặc chung)
const TitleGroup = ({ title, subtitle }) => (
    <div className="title-group mb-4"> {/* Tăng mb-4 */}
        <h1 className="h2 mb-0">{title}</h1>
        {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
);

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('profile'); // Tab mặc định là 'profile'

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'password':
                return <PasswordSettings />;
            case 'notification':
                return <NotificationSettings />;
            default:
                return <ProfileSettings />;
        }
    };

    return (
        // Bỏ các class col-md-9, col-lg-9 để nó chiếm toàn bộ không gian được cấp bởi layout cha
        // className="main-wrapper py-4 px-md-4" // Giữ lại padding nếu muốn
        <div className="settings-page-content"> {/* Class riêng cho trang settings */}
            <TitleGroup title="Settings" subtitle="Manage your account settings and preferences." />

            <div className="row my-4">
                <div className="col-lg-8 col-12"> {/* Tăng chiều rộng cho phần tab */}
                    <div className="custom-block bg-white p-4 shadow-sm"> {/* Thêm padding và shadow */}
                        <ul className="nav nav-tabs mb-3" id="settingsTab" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                                    id="profile-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="profile-tab-pane"
                                    aria-selected={activeTab === 'profile'}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    Profile
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                                    id="password-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="password-tab-pane"
                                    aria-selected={activeTab === 'password'}
                                    onClick={() => setActiveTab('password')}
                                >
                                    Password
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'notification' ? 'active' : ''}`}
                                    id="notification-tab"
                                    type="button"
                                    role="tab"
                                    aria-controls="notification-tab-pane"
                                    aria-selected={activeTab === 'notification'}
                                    onClick={() => setActiveTab('notification')}
                                >
                                    Notification
                                </button>
                            </li>
                        </ul>

                        <div className="tab-content" id="settingsTabContent">
                            {/* Render nội dung tab dựa trên activeTab */}
                            {renderTabContent()}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4 col-12"> {/* Giảm chiều rộng cột này */}
                    <div className="custom-block custom-block-contact bg-light p-4 shadow-sm"> {/* Thêm style cho contact block */}
                        <h5 className="mb-3">Still can’t find what you looking for?</h5>
                        <p>
                            <strong>Call us:</strong>
                            <a href="tel:305-240-9671" className="ms-2 text-decoration-none">
                                (60) 305-240-9671
                            </a>
                        </p>
                        <a href="#" className="btn btn-outline-primary mt-3 w-100"> {/* btn-outline-primary */}
                            Chat with us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;