// src/component/wallets/WalletManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
// --- THÊM CÁC DÒNG IMPORT CÒN THIẾU ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import các hàm service đúng
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../service/accountService';

// --- Giả sử có component Form Modal (bạn có thể tạo component này riêng) ---
const AccountFormModal = ({ show, onClose, onSubmit, accountToEdit }) => {
    const [formData, setFormData] = useState({});
    // ... logic của form modal
    if (!show) return null;
    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <p>Đây là Form Modal. Bạn cần xây dựng các trường input ở đây.</p>
                    <button onClick={onClose}>Close</button>
                    {/* Nút submit sẽ gọi hàm onSubmit */}
                </div>
            </div>
        </div>
    );
};


// --- Component chính ---
const WalletManagementPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);

    // --- ĐỊNH NGHĨA HÀM handleApiError ---
    const handleApiError = useCallback((err, context = "operation") => {
        let message = `An error occurred during ${context}.`;
        if (err.response && err.response.status === 401) {
            message = 'Session expired. Redirecting to login...';
            localStorage.removeItem('authToken');
            toast.error(message);
            setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 3000);
        } else {
            message = err.response?.data?.message || err.response?.data?.title || err.message;
            toast.error(message);
        }
        setError(message);
        console.error(`API Error (${context}):`, err);
    }, []);

    // --- ĐỊNH NGHĨA HÀM fetchAccounts ---
    const fetchAccounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            handleApiError(err, "loading accounts");
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);


    const handleOpenModal = (account = null) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAccountToEdit(null);
    };

    // --- ĐỊNH NGHĨA HÀM handleSubmitAccount ---
    const handleSubmitAccount = async (formData) => {
        // formData là dữ liệu từ form modal
        try {
            if (accountToEdit && accountToEdit.id) {
                // Trường hợp sửa
                await updateAccount(accountToEdit.id, formData);
                toast.success('Account updated successfully!');
            } else {
                // Trường hợp thêm mới
                await createAccount(formData);
                toast.success('Account created successfully!');
            }
            await fetchAccounts(); // Tải lại dữ liệu
            handleCloseModal(); // Đóng modal
        } catch (err) {
            handleApiError(err, 'saving account');
            // Ném lỗi để form modal biết và xử lý nếu cần
            throw err;
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                await deleteAccount(accountId);
                toast.success('Account deleted successfully!');
                await fetchAccounts(); // Tải lại dữ liệu
            } catch (err) {
                handleApiError(err, 'deleting account');
            }
        }
    };

    return (
        <div className="container mt-4">
            {/* --- THÊM ToastContainer ĐỂ HIỂN THỊ THÔNG BÁO --- */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">My Wallets / Accounts</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-circle-fill me-2"></i> Add Account
                </button>
            </div>

            {isLoading && <div className="text-center my-5"><div className="spinner-border"></div></div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {!isLoading && !error && (
                <div className="row g-4">
                    {accounts.length > 0 ? (
                        accounts.map(account => (
                            <div key={account.id} className="col-md-6 col-lg-4">
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{account.accountName}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">{account.bankName} - {account.accountType}</h6>
                                        <p className="card-text">
                                            <strong>Balance:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: account.currency || 'VND' }).format(account.balance)}<br />
                                            <strong>Account No:</strong> {account.accountNumber}
                                        </p>
                                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleOpenModal(account)}>Edit</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAccount(account.id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12">
                            <p className="text-center text-muted">No accounts found. Add one to get started!</p>
                        </div>
                    )}
                </div>
            )}

            <AccountFormModal
                show={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitAccount}
                accountToEdit={accountToEdit}
            />
        </div>
    );
};

export default WalletManagementPage;