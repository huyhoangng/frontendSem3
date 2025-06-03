// src/components/settings/PasswordSettings.js
import React, { useState } from 'react';

const PasswordSettings = () => {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }
        if (passwords.newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }
        // Xử lý logic cập nhật password
        console.log("Password data to submit:", passwords);
        // Gọi API cập nhật
        setSuccess("Password updated successfully!"); // Thông báo thành công (ví dụ)
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
    };

     const handleReset = () => {
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setError('');
        setSuccess('');
    };

    return (
        <div className="pt-4">
            <h5 className="mb-4">Change Password</h5>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}
            <form className="custom-form password-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        className="form-control"
                        placeholder="Enter Current Password"
                        value={passwords.currentPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        className="form-control"
                        placeholder="Enter New Password"
                        value={passwords.newPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        className="form-control"
                        placeholder="Confirm New Password"
                        value={passwords.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="d-flex mt-4">
                    <button type="button" className="btn btn-outline-secondary me-3" onClick={handleReset}>
                        Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Update Password
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PasswordSettings;