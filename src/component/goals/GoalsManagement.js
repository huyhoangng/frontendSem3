import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// --- API Configuration ---
const API_BASE_URL_GOALS = 'https://localhost:7166/api/Goals';

const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn("Auth token not found in localStorage. API requests might fail.");
    }
    return token;
};

const createAxiosInstance = () => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return axios.create({
        baseURL: API_BASE_URL_GOALS,
        headers: headers,
    });
};

// --- Normalization Function ---
const normalizeGoalFromApi = (apiGoal) => {
    const normalized = {
        id: apiGoal.goalId,
        goalName: apiGoal.goalName || '',
        description: apiGoal.description || '',
        goalType: apiGoal.goalType || 'Savings',
        targetAmount: Math.abs(apiGoal.targetAmount) || 0,
        currentAmount: Math.abs(apiGoal.currentAmount) || 0,
        targetDate: apiGoal.targetDate ? new Date(apiGoal.targetDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        priority: ['Low', 'Medium', 'High'].includes(apiGoal.priority) ? apiGoal.priority : 'Low',
        isCompleted: apiGoal.isCompleted || false,
        completedAt: apiGoal.completedAt,
        isActive: apiGoal.isActive ?? true,
        createdAt: apiGoal.createdAt,
        updatedAt: apiGoal.updatedAt
    };
    return normalized;
};

// --- Helper Function ---
// <<< CHANGE IS HERE >>>
const formatCurrency = (amount) => {
    // Changed to format as USD ($)
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// --- API Call Functions ---
const apiGetGoals = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/');
        const goalsData = Array.isArray(response.data) ? response.data : response.data.goals || [];
        return goalsData.map(normalizeGoalFromApi);
    } catch (error) {
        console.error("API Error - getGoals:", error.response?.data || error.message);
        throw error;
    }
};

const apiCreateGoal = async (axiosInstance, payload) => {
    try {
        const apiPayload = {
            goalName: payload.goalName.trim(),
            description: payload.description?.trim() || '',
            goalType: payload.goalType,
            targetAmount: parseFloat(payload.targetAmount),
            targetDate: new Date(payload.targetDate).toISOString(),
            priority: payload.priority,
            isActive: true,
            isCompleted: false,
            currentAmount: 0
        };
        const response = await axiosInstance.post('/', apiPayload);
        return normalizeGoalFromApi(response.data);
    } catch (error) {
        console.error("API Error - createGoal:", error);
        throw error;
    }
};

const apiUpdateGoal = async (axiosInstance, id, payload) => {
    try {
        const apiPayload = {
            goalId: parseInt(id),
            goalName: payload.goalName.trim(),
            description: payload.description?.trim() || '',
            goalType: payload.goalType,
            targetAmount: parseFloat(payload.targetAmount),
            targetDate: new Date(payload.targetDate).toISOString(),
            priority: payload.priority,
            isActive: true,
            isCompleted: payload.isCompleted,
            currentAmount: payload.currentAmount,
        };
        await axiosInstance.put(`/${id}`, apiPayload);
        return normalizeGoalFromApi({ ...payload, goalId: id });
    } catch (error) {
        console.error("API Error - updateGoal:", error);
        throw error;
    }
};

const apiDeleteGoal = async (axiosInstance, id) => {
    try {
        await axiosInstance.delete(`/${id}`);
    } catch (error) {
        console.error("API Error - deleteGoal:", error);
        throw error;
    }
};

const apiAddContribution = async (axiosInstance, goalId, amount) => {
    try {
        const payload = { amount: parseFloat(amount) };
        const response = await axiosInstance.post(`/${goalId}/contributions`, payload);
        return normalizeGoalFromApi(response.data);
    } catch (error) {
        console.error("API Error - addContribution:", error);
        throw error;
    }
};

// --- Goal Form Modal Component ---
const GoalFormModal = ({ onClose, onSubmit, goalToEdit }) => {
    const initialFormState = {
        goalName: '',
        description: '',
        goalType: 'Savings',
        targetAmount: '',
        targetDate: new Date().toISOString().slice(0, 10),
        priority: 'Low',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (goalToEdit) {
            setFormData({
                goalName: goalToEdit.goalName || '',
                description: goalToEdit.description || '',
                goalType: goalToEdit.goalType || 'Savings',
                targetAmount: goalToEdit.targetAmount?.toString() || '',
                targetDate: goalToEdit.targetDate ? new Date(goalToEdit.targetDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                priority: goalToEdit.priority || 'Low',
            });
        } else {
            setFormData(initialFormState);
        }
        setFormError('');
    }, [goalToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            if (!formData.goalName.trim()) throw new Error('Goal name is required');
            const amount = parseFloat(formData.targetAmount);
            if (isNaN(amount) || amount <= 0) throw new Error('Target amount must be a positive number');
            if (!formData.targetDate) throw new Error('Target date is required');

            const goalData = {
                ...formData,
                id: goalToEdit?.id,
                targetAmount: amount.toString(),
            };

            await onSubmit(goalData);
            onClose();
        } catch (err) {
            console.error('Form submission error:', err);
            setFormError(err.message || 'Error submitting form');
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const modalContentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1050, width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalContentStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">{goalToEdit ? 'Edit Goal' : 'Add New Goal'}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    {/* Form content remains the same */}
                    <div className="mb-3">
                        <label htmlFor="goal-name" className="form-label fw-bold">Goal Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="goal-name" name="goalName" value={formData.goalName} onChange={handleChange} required placeholder="E.g., Save for vacation"/>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-description" className="form-label fw-bold">Description (Optional)</label>
                        <textarea className="form-control" id="goal-description" name="description" rows="2" value={formData.description} onChange={handleChange} placeholder="E.g., Saving for a trip to Europe"></textarea>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="goal-type" className="form-label fw-bold">Goal Type</label>
                            <select className="form-select" id="goal-type" name="goalType" value={formData.goalType} onChange={handleChange}>
                                <option value="Savings">Savings</option>
                                <option value="Debt Repayment">Debt Repayment</option>
                                <option value="Investment">Investment</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="goal-priority" className="form-label fw-bold">Priority</label>
                            <select className="form-select" id="goal-priority" name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-targetAmount" className="form-label fw-bold">Target Amount <span className="text-danger">*</span></label>
                        <input type="number" step="any" className="form-control" id="goal-targetAmount" name="targetAmount" value={formData.targetAmount} onChange={handleChange} required placeholder="0.00" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-targetDate" className="form-label fw-bold">Target Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="goal-targetDate" name="targetDate" value={formData.targetDate} onChange={handleChange} required />
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{goalToEdit ? 'Save Changes' : 'Add Goal'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Contribution Form Modal Component ---
const ContributionFormModal = ({ onClose, onSubmit, goal }) => {
    const [amount, setAmount] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!goal) return null;

    const remainingAmount = goal.targetAmount - goal.currentAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const contributionAmount = parseFloat(amount);
        if (isNaN(contributionAmount) || contributionAmount <= 0) {
            setFormError('Contribution amount must be a positive number.');
            return;
        }
        if (contributionAmount > remainingAmount) {
            setFormError(`Contribution cannot exceed the remaining amount of ${formatCurrency(remainingAmount)}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(goal.id, contributionAmount);
            onClose();
        } catch (err) {
            setFormError(err.message || 'Failed to add contribution.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const modalContentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', zIndex: 1050, width: '90%', maxWidth: '500px' };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalContentStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">Add Contribution</h2>
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>
                <p>For goal: <strong>{goal.goalName}</strong></p>
                <div className="alert alert-info py-2">
                    <div>Target: {formatCurrency(goal.targetAmount)}</div>
                    <div>Current: {formatCurrency(goal.currentAmount)}</div>
                    <hr className="my-1"/>
                    <strong>Remaining: {formatCurrency(remainingAmount)}</strong>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="contribution-amount" className="form-label fw-bold">Amount to Add <span className="text-danger">*</span></label>
                        <input type="number" step="any" className="form-control" id="contribution-amount" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" autoFocus />
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting}>{isSubmitting ? 'Contributing...' : 'Contribute'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- GoalsManagement Component (Main Page Component) ---
const GoalsManagement = () => {
    const [goals, setGoals] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState(null);
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [goalToContribute, setGoalToContribute] = useState(null);
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    const axiosInstance = useMemo(() => createAxiosInstance(), []);

    const handleApiError = useCallback((error, context = "operation") => {
        let message = `Error during ${context}.`;
        if (error.response) {
            if (error.response.status === 401) { message = 'Session expired or invalid. Redirecting to login...'; localStorage.removeItem('authToken'); setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 2500); }
            else if (error.response.data) {
                if (typeof error.response.data === 'string' && error.response.data.length < 200) message = error.response.data;
                else if (error.response.data.message) message = error.response.data.message;
                else if (error.response.data.title) message = error.response.data.title;
                else if (error.response.data.error) message = error.response.data.error;
            }
        } else if (error.request) { message = `Network error during ${context}. Please check your connection.`; }
        else { message = error.message || `Unknown error during ${context}.`; }
        setPageError(message); console.error(`API Error (${context}):`, error);
    }, []);

    const fetchGoals = useCallback(async () => {
        setIsLoading(true); setPageError('');
        try {
            const goals = await apiGetGoals(axiosInstance);
            setGoals(goals);
        } catch (error) {
            handleApiError(error, 'fetching goals');
        } finally {
            setIsLoading(false);
        }
    }, [axiosInstance, handleApiError]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const handleOpenAddGoalModal = () => { setGoalToEdit(null); setIsModalOpen(true); };
    const handleOpenEditGoalModal = (goal) => { setGoalToEdit(goal); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setGoalToEdit(null); };
    const handleOpenContributionModal = (goal) => { setGoalToContribute(goal); setIsContributionModalOpen(true); };
    const handleCloseContributionModal = () => { setIsContributionModalOpen(false); setGoalToContribute(null); };

    const handleSubmitGoal = async (goalData) => {
        setIsLoading(true); setPageError('');
        try {
            if (goalToEdit) { await apiUpdateGoal(axiosInstance, goalData.id, goalData); alert('Goal updated successfully!'); }
            else { await apiCreateGoal(axiosInstance, goalData); alert('Goal added successfully!'); }
            await fetchGoals(); handleCloseModal();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save goal';
            handleApiError(error, 'saving goal'); throw new Error(errorMessage);
        } finally { setIsLoading(false); }
    };

    const handleDeleteGoal = async (goalId) => {
        const goalToDelete = goals.find(g => g.id === goalId);
        if (!goalToDelete) { alert('Goal not found!'); return; }
        if (window.confirm(`Are you sure you want to delete the goal "${goalToDelete.goalName}"?`)) {
            setIsLoading(true); setPageError('');
            try { await apiDeleteGoal(axiosInstance, goalId); alert('Goal deleted successfully!'); await fetchGoals(); }
            catch (error) { handleApiError(error, 'deleting goal'); }
            finally { setIsLoading(false); }
        }
    };

    const handleSubmitContribution = async (goalId, amount) => {
        setIsLoading(true);
        try {
            await apiAddContribution(axiosInstance, goalId, amount);
            alert('Contribution added successfully!');
            await fetchGoals();
        } catch (error) {
            handleApiError(error, 'adding contribution'); throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const filteredGoals = goals.filter(goal => {
        if (filterType && goal.goalType !== filterType) return false;
        if (filterPriority && goal.priority !== filterPriority) return false;
        return true;
    });

    const renderGoalRow = (goal) => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        
        return (
            <tr key={goal.id}>
                <td>
                    <div className="fw-bold">{goal.goalName}</div>
                    <div className="progress mt-1" style={{ height: '10px' }}>
                        <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small className="text-muted">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)} ({Math.round(progress)}%)</small>
                </td>
                <td>{goal.goalType}</td>
                <td>{new Date(goal.targetDate).toLocaleDateString('en-GB')}</td>
                <td><span className={`badge ${goal.priority === 'High' ? 'bg-danger' : goal.priority === 'Medium' ? 'bg-warning' : 'bg-info'}`}>{goal.priority}</span></td>
                <td className="text-center">
                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleOpenContributionModal(goal)} title="Add Contribution" disabled={goal.isCompleted}><i className="bi bi-piggy-bank-fill"></i></button>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleOpenEditGoalModal(goal)} title="Edit Goal" disabled={goal.isCompleted}><i className="bi bi-pencil-fill"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGoal(goal.id)} title="Delete Goal" disabled={goal.isCompleted}><i className="bi bi-trash3-fill"></i></button>
                </td>
            </tr>
        );
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Goals Management</h1>
                <button className="btn btn-primary" onClick={handleOpenAddGoalModal}><i className="bi bi-plus-circle-fill me-2"></i>Add Goal</button>
            </div>

            {(isLoading || pageError || goals.length > 0 || filterType || filterPriority) && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        {isLoading ? <div className="text-muted">Loading filters...</div> : 
                        <>
                            <h5 className="card-title mb-3">Filters</h5>
                            <div className="row g-3">
                                <div className="col-md-4"><label htmlFor="filterType" className="form-label form-label-sm">Goal Type</label><select id="filterType" className="form-select form-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}><option value="">All</option><option value="Savings">Savings</option><option value="Debt Repayment">Debt Repayment</option><option value="Investment">Investment</option></select></div>
                                <div className="col-md-4"><label htmlFor="filterPriority" className="form-label form-label-sm">Priority</label><select id="filterPriority" className="form-select form-select-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}><option value="">All</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                                <div className="col-md-4 d-flex align-items-end"><button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilterType(''); setFilterPriority(''); }}><i className="bi bi-x-lg me-1"></i>Clear Filters</button></div>
                            </div>
                        </>
                        }
                    </div>
                </div>
            )}
            
            {isLoading ? <div className="alert alert-info text-center">Loading data...</div> :
             pageError ? <div className="alert alert-danger text-center">{pageError}</div> :
             filteredGoals.length > 0 ? (
                <div className="table-responsive card shadow-sm">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{width: '40%'}}>Goal & Progress</th>
                                <th>Type</th>
                                <th>Target Date</th>
                                <th>Priority</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>{filteredGoals.map(renderGoalRow)}</tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center p-5 border rounded bg-light">
                    <i className="bi bi-target" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    <p className="mt-3 mb-2 text-muted">{ (filterType || filterPriority) ? "No goals match the selected filters." : "No goals have been set yet."}</p>
                </div>
            )}

            {isModalOpen && <GoalFormModal onClose={handleCloseModal} onSubmit={handleSubmitGoal} goalToEdit={goalToEdit} />}
            {isContributionModalOpen && <ContributionFormModal onClose={handleCloseContributionModal} onSubmit={handleSubmitContribution} goal={goalToContribute} />}
        </div>
    );
};

export default GoalsManagement;