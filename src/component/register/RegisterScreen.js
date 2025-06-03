// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate để chuyển hướng sau khi đăng ký
import { registerUser } from '../service/authService'; // Import hàm API

const RegisterScreen = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '', // Thêm confirmPassword để validate
        firstName: '',
        lastName: '',
        dateOfBirth: '', // Format YYYY-MM-DD cho input type="date"
        phoneNumber: '',
        currency: 'USD', // Mặc định
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        // Chuẩn bị dữ liệu gửi đi (bỏ confirmPassword)
        const dataToSubmit = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            // API yêu cầu định dạng "YYYY-MM-DDTHH:mm:ss"
            // Input date trả về "YYYY-MM-DD", cần thêm thời gian
            dateOfBirth: formData.dateOfBirth ? `${formData.dateOfBirth}T00:00:00` : null, // Gửi null nếu không nhập
            phoneNumber: formData.phoneNumber,
            currency: formData.currency,
        };

        try {
            const result = await registerUser(dataToSubmit);
            setSuccess(result.message || 'Registration successful! Please login.'); // API có thể trả về message
            // Reset form hoặc chuyển hướng
            setFormData({
                email: '', password: '', confirmPassword: '', firstName: '',
                lastName: '', dateOfBirth: '', phoneNumber: '', currency: 'USD',
            });
            // Chuyển hướng đến trang đăng nhập sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center min-vh-100 py-4">
            <div className="card shadow-lg" style={{ width: '100%', maxWidth: '500px' }}>
                <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                        {/* <img src="/path-to-your-logo.png" alt="Logo" style={{width: '100px', marginBottom: '1rem'}} /> */}
                        <i className="bi-box display-4 text-primary"></i> {/* Hoặc logo của bạn */}
                        <h2 className="card-title mt-2">Create Account</h2>
                        <p className="text-muted">Join us and start managing your finances!</p>
                    </div>

                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    {success && <div className="alert alert-success py-2">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="firstName" className="form-label">First Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="lastName" className="form-label">Last Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address <span className="text-danger">*</span></label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6" // Thêm validate cơ bản
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="text-danger">*</span></label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-7 mb-3">
                                <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                                <input
                                    type="date" // Input type date sẽ trả về format YYYY-MM-DD
                                    className="form-control"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-5 mb-3">
                                <label htmlFor="currency" className="form-label">Currency</label>
                                <select
                                    className="form-select"
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                >
                                    <option value="USD">USD</option>
                                    <option value="VND">VND</option>
                                    <option value="EUR">EUR</option>
                                    {/* Thêm các loại tiền tệ khác nếu cần */}
                                </select>
                            </div>
                        </div>


                        <div className="mb-3">
                            <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="Example: 0123456789"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="mb-0">Already have an account? <Link to="/login">Login here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;