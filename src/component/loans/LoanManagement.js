// src/page/LoanPage.js
import React, { useEffect, useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import { getAllLoans, createLoan } from '../service/loanService';
// Giả sử bạn đã tạo API này
const LoanManagement = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
      loanName: '',
      loanType: '',
      borrower: '',
      borrowerPhone: '',
      borrowerEmail: '',
      originalAmount: 0,
      interestRate: 0,
      expectedPayment: 0,
      paymentDueDate: 1,
      nextPaymentDate: '',
      loanDate: '',
      dueDate: '',
      contractDocument: '',
      notes: '',
      accountId: 0,
    });
  
    useEffect(() => {
      fetchLoans();
    }, []);
  
    const fetchLoans = async () => {
      try {
        const data = await getAllLoans();
        setLoans(data);
      } catch (error) {
        console.error('Không thể tải danh sách khoản vay:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const loanToSubmit = {
          ...formData,
          originalAmount: parseFloat(formData.originalAmount),
          expectedPayment: parseFloat(formData.expectedPayment),
          interestRate: parseFloat(formData.interestRate),
          paymentDueDate: parseInt(formData.paymentDueDate),
          accountId: parseInt(formData.accountId),
        };
        await createLoan(loanToSubmit);
        alert('Tạo khoản vay thành công!');
        fetchLoans(); // refresh danh sách
      } catch (error) {
        console.error('Lỗi khi tạo khoản vay:', error);
        alert('Tạo khoản vay thất bại.');
      }
    };
  
    return (
      <div className="container mt-4">
        <h2 className="mb-4">Tạo khoản vay mới</h2>
        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-6">
            <label>Tên khoản vay</label>
            <input name="loanName" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col-md-6">
            <label>Loại khoản vay</label>
            <input name="loanType" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label>Người vay</label>
            <input name="borrower" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label>SĐT người vay</label>
            <input name="borrowerPhone" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Email người vay</label>
            <input name="borrowerEmail" type="email" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <label>Số tiền vay</label>
            <input name="originalAmount" type="number" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col-md-3">
            <label>Lãi suất (%)</label>
            <input name="interestRate" type="number" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <label>Khoản thanh toán</label>
            <input name="expectedPayment" type="number" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <label>Ngày đến hạn (số)</label>
            <input name="paymentDueDate" type="number" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Ngày vay</label>
            <input name="loanDate" type="datetime-local" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Ngày trả tiếp theo</label>
            <input name="nextPaymentDate" type="datetime-local" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label>Hạn trả cuối</label>
            <input name="dueDate" type="datetime-local" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label>File hợp đồng (URL)</label>
            <input name="contractDocument" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label>Ghi chú</label>
            <input name="notes" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <label>Tài khoản liên kết (AccountId)</label>
            <input name="accountId" type="number" className="form-control" onChange={handleChange} />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary">Tạo khoản vay</button>
          </div>
        </form>
  
        <hr className="my-5" />
  
        <h2 className="mb-4">Danh sách khoản vay</h2>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Tên khoản vay</th>
                  <th>Người vay</th>
                  <th>Gốc</th>
                  <th>Còn lại</th>
                  <th>Ngày vay</th>
                  <th>Hạn trả</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.loanId}>
                    <td>{loan.loanName}</td>
                    <td>{loan.borrower}</td>
                    <td>{loan.originalAmount.toLocaleString()} VND</td>
                    <td>{loan.currentBalance.toLocaleString()} VND</td>
                    <td>{new Date(loan.loanDate).toLocaleDateString()}</td>
                    <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  export default LoanManagement;