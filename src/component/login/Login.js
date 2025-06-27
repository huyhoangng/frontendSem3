// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../service/authService'; // Import hàm loginUser
import '../login/LoginLayout.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Vui lòng nhập email và mật khẩu.');
            setIsLoading(false);
            return;
        }

        try {
            const credentials = { email, password };
            const result = await loginUser(credentials); 

            console.log('Login successful API Result:', result);


            if (result && (result.token || (typeof result === 'object' && result.message?.toLowerCase().includes('success')) || (typeof result === 'string' && result.toLowerCase().includes('success'))) ) {
                // Lưu token (ví dụ)
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                    // Nếu API trả về thông tin người dùng, bạn có thể lưu vào context/redux
                    // ví dụ: dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
                }

                
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // Chuyển hướng đến trang mong muốn sau khi đăng nhập thành công
                // (thường là dashboard hoặc trang trước đó người dùng cố gắng truy cập)
                navigate('/overview'); // Hoặc navigate('/') nếu bạn có logic redirect trong App.js
            } else {
                // Nếu API trả về 200 OK nhưng không có token hoặc thông báo thành công rõ ràng
                setError(result.message || 'Error Login. Please check your information.');
            }

        } catch (apiError) {
            console.error('Lỗi API khi đăng nhập:', apiError);
            setError(apiError.message || 'Error. Try again!!');
        } finally {
            setIsLoading(false);
        }
    };

    // Lấy email đã lưu nếu có
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);


    return (
        <div className="login-page-container d-flex align-items-center justify-content-center min-vh-100 py-4 bg-light">
            <div className="login-form-wrapper card shadow-lg" style={{ width: '100%', maxWidth: '450px' }}>
                <div className="login-form-container card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                        <i className="bi bi-box-arrow-in-right display-3 text-primary mb-2"></i>
                        <h2 className="fw-bold">Login now</h2>
                        <p className="text-muted">Welcome back!</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                className={`form-control ${error && !email ? 'is-invalid' : ''}`}
                                id="floatingEmail"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <label htmlFor="floatingEmail">Email</label>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="password"
                                className={`form-control ${error && !password ? 'is-invalid' : ''}`}
                                id="floatingPassword"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <label htmlFor="floatingPassword">Password</label>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="rememberMeCheck"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <label className="form-check-label" htmlFor="rememberMeCheck">
                                    Remember account.
                                </label>
                            </div>
                            <Link to="/forgot-password" tabIndex={isLoading ? -1 : 0} className={`text-decoration-none ${isLoading ? 'disabled-link pe-none' : ''}`}>Quên mật khẩu?</Link>
                        </div>

                        <div className="d-grid">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg fw-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Loging in...
                                    </>
                                ) : (
                                    'Đăng Nhập'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-muted mb-0">
                            Don't have account?{' '}
                            <Link to="/register" tabIndex={isLoading ? -1 : 0} className={`fw-medium text-decoration-none ${isLoading ? 'disabled-link pe-none' : ''}`}>Register now</Link>
                        </p>
                    </div>
                </div>
                 <div className="login-footer card-footer text-center py-3 bg-transparent border-top-0">
                    <small className="text-muted">© {new Date().getFullYear()} Your Finance. All rights reserved.</small>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;