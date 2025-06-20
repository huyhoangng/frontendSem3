// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../service/authService';

const RegisterScreen = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phoneNumber: '',
        currency: 'USD',
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

        const dataToSubmit = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth ? `${formData.dateOfBirth}T00:00:00` : null,
            phoneNumber: formData.phoneNumber,
            currency: formData.currency,
        };

        try {
            // Không cần lưu 'result' nếu API không trả về gì đặc biệt
            await registerUser(dataToSubmit);
            
            // <<< THAY ĐỔI 1: Cập nhật thông báo thành công theo yêu cầu của bạn >>>
            setSuccess('Registration successful. Please check your email to activate your account.');
            
            // Reset form sau khi đăng ký thành công
            setFormData({
                email: '', password: '', confirmPassword: '', firstName: '',
                lastName: '', dateOfBirth: '', phoneNumber: '', currency: 'USD',
            });

            // <<< THAY ĐỔI 2: Loại bỏ việc tự động chuyển hướng >>>
            // Lý do: Người dùng cần phải vào mail để kích hoạt trước khi có thể đăng nhập.
            // Việc chuyển hướng họ đến trang login ngay sẽ gây ra trải nghiệm không tốt.
            /* 
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            */

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
                        <i className="bi-box display-4 text-primary"></i>
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
                                minLength="6"
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
                                    type="date"
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