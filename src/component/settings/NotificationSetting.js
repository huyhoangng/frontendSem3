// src/components/settings/NotificationSettings.js
import React, { useState } from 'react';

const NotificationSettings = () => {
    const [notifications, setNotifications] = useState({
        accountActivity: true,
        paymentUpdated: true,
        // Thêm các setting khác nếu có
    });

    const handleChange = (e) => {
        setNotifications({ ...notifications, [e.target.name]: e.target.checked });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Xử lý logic cập nhật notification settings
        console.log("Notification settings to submit:", notifications);
        // Gọi API cập nhật
    };

    const handleReset = () => {
        // Lấy lại cài đặt gốc từ API hoặc state ban đầu
        setNotifications({
            accountActivity: true,
            paymentUpdated: true,
        });
    };

    return (
        <div className="pt-4">
            <h5 className="mb-4">Notification Settings</h5>
            <form className="custom-form notification-form" onSubmit={handleSubmit}>
                <div className="form-check form-switch d-flex justify-content-between align-items-center mb-3 p-0"> {/* p-0 và justify-content-between */}
                    <label className="form-check-label" htmlFor="accountActivity">
                        Account activity
                        <small className="d-block text-muted">Notify about logins, profile changes, etc.</small>
                    </label>
                    <input
                        className="form-check-input" // Bỏ ms-auto, để flexbox tự căn
                        type="checkbox"
                        name="accountActivity"
                        role="switch"
                        id="accountActivity"
                        checked={notifications.accountActivity}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-check form-switch d-flex justify-content-between align-items-center mb-3 p-0">
                    <label className="form-check-label" htmlFor="paymentUpdated">
                        Payment updates
                        <small className="d-block text-muted">Notify about successful or failed payments.</small>
                    </label>
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="paymentUpdated"
                        role="switch"
                        id="paymentUpdated"
                        checked={notifications.paymentUpdated}
                        onChange={handleChange}
                    />
                </div>
                {/* Thêm các switch khác nếu cần */}
                <div className="d-flex mt-4 pt-3 border-top"> {/* Thêm border-top và padding */}
                    <button type="button" className="btn btn-outline-secondary me-3" onClick={handleReset}>
                        Reset to Defaults
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationSettings;