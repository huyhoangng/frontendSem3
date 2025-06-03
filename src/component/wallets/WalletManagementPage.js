// src/pages/WalletManagementPage.js (Hoặc tên file bạn muốn)
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Để tạo ID duy nhất

// --- Helper function để format tiền tệ ---
const formatCurrency = (amount, currency = "VND") => {
    // Kiểm tra nếu amount không phải là số thì trả về chuỗi rỗng hoặc giá trị mặc định
    if (isNaN(parseFloat(amount))) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency }).format(0);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency }).format(amount);
};

// --- Start: Định nghĩa AccountFormModal (Component nội bộ) ---
const AccountFormModal = ({ isOpen, onClose, onSubmit, accountToEdit }) => {
    const initialFormState = {
        name: '',
        type: 'bank',
        balance: '',
        currency: 'VND',
        description: '',
        icon: 'bi-wallet2',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');

    const accountTypes = [
        { value: 'bank', label: 'Tài khoản ngân hàng', icon: 'bi-bank2' },
        { value: 'ewallet', label: 'Ví điện tử', icon: 'bi-phone' },
        { value: 'cash', label: 'Tiền mặt', icon: 'bi-cash-coin' },
        { value: 'savings', label: 'Tiết kiệm', icon: 'bi-piggy-bank' },
        { value: 'credit_card', label: 'Thẻ tín dụng', icon: 'bi-credit-card-2-front' },
        { value: 'investment', label: 'Đầu tư', icon: 'bi-graph-up-arrow' },
        { value: 'other', label: 'Khác', icon: 'bi-wallet2' },
    ];

    useEffect(() => {
        if (accountToEdit) {
            setFormData({
                name: accountToEdit.name || '',
                type: accountToEdit.type || 'bank',
                balance: accountToEdit.balance !== undefined ? String(accountToEdit.balance) : '', // Chuyển số thành chuỗi cho input
                currency: accountToEdit.currency || 'VND',
                description: accountToEdit.description || '',
                icon: accountToEdit.icon || 'bi-wallet2',
            });
        } else {
            setFormData(initialFormState);
            // Tự động set icon khi thêm mới và type thay đổi
            const selectedType = accountTypes.find(t => t.value === initialFormState.type);
            if (selectedType) {
                setFormData(prev => ({ ...prev, icon: selectedType.icon }));
            }
        }
        setFormError('');
    }, [accountToEdit, isOpen]); // Thêm isOpen để reset form khi modal mở lại

    useEffect(() => {
        // Tự động cập nhật icon khi type thay đổi (cho cả thêm mới và sửa)
        // hoặc chỉ khi thêm mới nếu bạn muốn: if (!accountToEdit) { ... }
        const selectedType = accountTypes.find(t => t.value === formData.type);
        if (selectedType) {
            // Chỉ cập nhật icon nếu nó khác với icon hiện tại để tránh vòng lặp vô hạn nếu người dùng tự nhập icon
            if (formData.icon !== selectedType.icon && (!accountToEdit || (accountToEdit && accountToEdit.type !== formData.type))) {
                 setFormData(prev => ({ ...prev, icon: selectedType.icon }));
            }
        }
    }, [formData.type]);


    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(''); // Reset lỗi trước mỗi lần submit

        if (!formData.name.trim()) {
            setFormError('Tên tài khoản không được để trống.');
            return;
        }
        const balanceValue = parseFloat(formData.balance);
        if (isNaN(balanceValue)) {
            setFormError('Số dư phải là một con số hợp lệ.');
            return;
        }

        const accountData = {
            ...formData,
            id: accountToEdit ? accountToEdit.id : uuidv4(),
            balance: balanceValue
        };
        onSubmit(accountData);
        onClose();
    };

    return (
        <>
            <div className="modal-backdrop fade show" style={{ display: 'block' }} onClick={onClose}></div>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg"> {/* Thêm modal-lg cho rộng hơn */}
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {accountToEdit ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="alert alert-danger py-2">{formError}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="accountName" className="form-label">Tên tài khoản <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="accountName"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ví dụ: Ngân hàng Techcombank, Ví Momo"
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="accountType" className="form-label">Loại tài khoản</label>
                                        <select
                                            className="form-select"
                                            id="accountType"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                        >
                                            {accountTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                     <div className="col-md-6 mb-3">
                                        <label htmlFor="accountIcon" className="form-label">Icon (Bootstrap Icons)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="accountIcon"
                                            name="icon"
                                            value={formData.icon}
                                            onChange={handleChange}
                                            placeholder="Ví dụ: bi-bank2"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-7 mb-3">
                                        <label htmlFor="accountBalance" className="form-label">Số dư ban đầu / Hiện tại <span className="text-danger">*</span></label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="form-control"
                                            id="accountBalance"
                                            name="balance"
                                            value={formData.balance}
                                            onChange={handleChange}
                                            required
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-md-5 mb-3">
                                        <label htmlFor="accountCurrency" className="form-label">Tiền tệ</label>
                                        <select
                                            className="form-select"
                                            id="accountCurrency"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                        >
                                            <option value="VND">VND</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="accountDescription" className="form-label">Mô tả (Tùy chọn)</label>
                                    <textarea
                                        className="form-control"
                                        id="accountDescription"
                                        name="description"
                                        rows="2"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Ghi chú thêm về tài khoản này (VD: Số tài khoản, chi nhánh...)"
                                    ></textarea>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">
                                        {accountToEdit ? 'Lưu thay đổi' : 'Thêm tài khoản'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// --- End: Định nghĩa AccountFormModal ---


// --- Start: Component chính WalletManagementPage ---
const WalletManagementPage = () => {
    const [accounts, setAccounts] = useState(() => {
        const savedAccounts = localStorage.getItem('userFinancialAccounts'); // Đổi key localStorage
        return savedAccounts ? JSON.parse(savedAccounts) : []; // Khởi tạo rỗng nếu không có dữ liệu
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        localStorage.setItem('userFinancialAccounts', JSON.stringify(accounts));
    }, [accounts]);

    const handleOpenAddModal = () => {
        setAccountToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (account) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAccountToEdit(null);
    };

    const handleSubmitAccount = (accountData) => {
        if (accountToEdit) {
            setAccounts(accounts.map(acc => acc.id === accountData.id ? accountData : acc));
        } else {
            setAccounts(prevAccounts => [...prevAccounts, accountData]);
        }
    };

    const handleDeleteAccount = (accountId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.")) {
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        }
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Tính tổng số dư (hiện chỉ tính VND)
    const totalBalanceVND = accounts
        .filter(acc => acc.currency === "VND")
        .reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="container mt-4"> {/* Sử dụng Bootstrap container cho padding và căn chỉnh */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap"> {/* flex-wrap cho responsive */}
                <div className="mb-2 mb-md-0">
                    <h1 className="h2 mb-0">Quản Lý Tài Khoản (Ví)</h1>
                    {accounts.length > 0 && (
                        <p className="text-muted mb-0">
                            Tổng số dư (VND): <strong className="text-success">{formatCurrency(totalBalanceVND, "VND")}</strong>
                        </p>
                    )}
                </div>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Thêm tài khoản mới
                </button>
            </div>

            {accounts.length > 0 && (
                 <div className="row mb-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tìm kiếm tài khoản..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {accounts.length === 0 ? (
                <div className="text-center p-5 border rounded bg-light shadow-sm">
                    <i className="bi bi-wallet2" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                    <h4 className="mt-3 mb-2">Bạn chưa có tài khoản nào</h4>
                    <p className="text-muted">Hãy bắt đầu quản lý tài chính của bạn bằng cách thêm tài khoản đầu tiên!</p>
                    <button className="btn btn-lg btn-success mt-3" onClick={handleOpenAddModal}>
                        <i className="bi bi-plus-lg me-2"></i>Tạo Tài Khoản Ngay
                    </button>
                </div>
            ) : filteredAccounts.length === 0 && searchTerm ? (
                <div className="alert alert-warning text-center">Không tìm thấy tài khoản nào khớp với từ khóa "<strong className="mx-1">{searchTerm}</strong>".</div>
            ) : (
                <div className="row g-4"> {/* g-4 cho gutter lớn hơn */}
                    {filteredAccounts.map(account => (
                        <div className="col-md-6 col-lg-4" key={account.id}>
                            <div className="card h-100 shadow-hover"> {/* Thêm class shadow-hover nếu có CSS cho nó */}
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex align-items-center mb-2"> {/* align-items-center cho icon và title */}
                                        <i className={`${account.icon || 'bi-wallet2'} me-3`} style={{ fontSize: '2.2rem', color: '#0d6efd' }}></i>
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-0 text-truncate" title={account.name}>{account.name}</h5>
                                            <small className="text-muted text-capitalize">{account.type.replace('_', ' ')}</small>
                                        </div>
                                        <div className="dropdown">
                                            <button className="btn btn-sm btn-light py-0 px-2" type="button" id={`dropdownMenuButton-${account.id}`} data-bs-toggle="dropdown" aria-expanded="false">
                                                <i className="bi bi-three-dots-vertical"></i>
                                            </button>
                                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`dropdownMenuButton-${account.id}`}>
                                                <li>
                                                    <button className="dropdown-item" onClick={() => handleOpenEditModal(account)}>
                                                        <i className="bi bi-pencil-square me-2"></i>Sửa
                                                    </button>
                                                </li>
                                                <li>
                                                    <button className="dropdown-item text-danger" onClick={() => handleDeleteAccount(account.id)}>
                                                        <i className="bi bi-trash3 me-2"></i>Xóa
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <h2 className="card-text my-3 fw-bold" style={{color: account.balance >= 0 ? 'var(--bs-success)' : 'var(--bs-danger)'}}>
                                        {formatCurrency(account.balance, account.currency)}
                                    </h2>
                                    {account.description && (
                                        <p className="card-text text-muted small mt-auto mb-0 fst-italic">
                                            <i className="bi bi-info-circle me-1"></i>{account.description}
                                        </p>
                                    )}
                                    {!account.description && <div className="mt-auto"></div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <AccountFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitAccount}
                    accountToEdit={accountToEdit}
                />
            )}
        </div>
    );
};
// --- End: Component chính WalletManagementPage ---

export default WalletManagementPage;