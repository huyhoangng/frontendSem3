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
    const targetDate = apiGoal.targetDate && !isNaN(new Date(apiGoal.targetDate).getTime())
        ? new Date(apiGoal.targetDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    return {
        id: apiGoal.id || uuidv4(),
        goalName: apiGoal.goalName || '',
        description: apiGoal.description || '',
        goalType: apiGoal.goalType || 'Savings',
        targetAmount: Math.abs(apiGoal.targetAmount) || 0,
        targetDate,
        priority: ['Low', 'Medium', 'High'].includes(apiGoal.priority) ? apiGoal.priority : 'Low',
    };
};

// --- Helper Function ---
const formatCurrency = (amount, currency = "VND") => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
};

// --- API Call Functions ---
const apiGetGoals = async (axiosInstance) => {
    try {
        const response = await axiosInstance.get('/');
        const goalsData = Array.isArray(response.data) ? response.data : response.data.goals || [];
        if (!Array.isArray(goalsData)) {
            console.error("Goals API did not return an array:", goalsData);
            throw new Error('Goals data is not an array.');
        }
        return goalsData.map(normalizeGoalFromApi);
    } catch (error) {
        console.error("API Error - getGoals:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch goals.');
    }
};

const apiCreateGoal = async (axiosInstance, payload) => {
    try {
        const response = await axiosInstance.post('/', payload);
        return normalizeGoalFromApi(response.data);
    } catch (error) {
        console.error("API Error - createGoal:", error.response?.data || error.message);
        throw error;
    }
};

const apiUpdateGoal = async (axiosInstance, id, payload) => {
    try {
        const response = await axiosInstance.put(`/${id}`, payload);
        return response.data ? normalizeGoalFromApi(response.data) : null;
    } catch (error) {
        console.error("API Error - updateGoal:", error.response?.data || error.message);
        throw error;
    }
};

const apiDeleteGoal = async (axiosInstance, id) => {
    try {
        await axiosInstance.delete(`/${id}`);
    } catch (error) {
        console.error("API Error - deleteGoal:", error.response?.data || error.message);
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

    useEffect(() => {
        if (goalToEdit) {
            setFormData({
                goalName: goalToEdit.goalName || '',
                description: goalToEdit.description || '',
                goalType: ['Savings', 'Debt Repayment', 'Investment'].includes(goalToEdit.goalType) ? goalToEdit.goalType : 'Savings',
                targetAmount: goalToEdit.targetAmount !== undefined ? String(Math.abs(goalToEdit.targetAmount)) : '',
                targetDate: goalToEdit.targetDate || initialFormState.targetDate,
                priority: ['Low', 'Medium', 'High'].includes(goalToEdit.priority) ? goalToEdit.priority : 'Low',
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
        if (!formData.goalName.trim()) {
            setFormError('Goal name cannot be empty.');
            return;
        }
        const amountValue = parseFloat(formData.targetAmount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setFormError('Target amount must be a positive number.');
            return;
        }
        if (!formData.targetDate) {
            setFormError('Please select a target date.');
            return;
        }
        const goalData = {
            ...formData,
            id: goalToEdit ? goalToEdit.id : uuidv4(),
            targetAmount: amountValue,
        };
        try {
            await onSubmit(goalData);
            onClose(); // Close modal on successful submission
        } catch (err) {
            setFormError(err.message || 'Error submitting form.');
        }
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1040,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    const modalContentStyle = {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        zIndex: 1050,
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
    };

    return (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalContentStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">{goalToEdit ? 'Edit Goal' : 'Add New Goal'}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                {formError && <div className="alert alert-danger py-2 mb-3">{formError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="goal-name" className="form-label fw-bold">Goal Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            id="goal-name"
                            name="goalName"
                            value={formData.goalName}
                            onChange={handleChange}
                            required
                            placeholder="E.g., Save for vacation"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-description" className="form-label fw-bold">Description (Optional)</label>
                        <textarea
                            className="form-control"
                            id="goal-description"
                            name="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="E.g., Saving for a trip to Europe"
                        ></textarea>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="goal-type" className="form-label fw-bold">Goal Type</label>
                            <select
                                className="form-select"
                                id="goal-type"
                                name="goalType"
                                value={formData.goalType}
                                onChange={handleChange}
                            >
                                <option value="Savings">Savings</option>
                                <option value="Debt Repayment">Debt Repayment</option>
                                <option value="Investment">Investment</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="goal-priority" className="form-label fw-bold">Priority</label>
                            <select
                                className="form-select"
                                id="goal-priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-targetAmount" className="form-label fw-bold">Target Amount <span className="text-danger">*</span></label>
                        <input
                            type="number"
                            step="any"
                            className="form-control"
                            id="goal-targetAmount"
                            name="targetAmount"
                            value={formData.targetAmount}
                            onChange={handleChange}
                            required
                            placeholder="0"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="goal-targetDate" className="form-label fw-bold">Target Date <span className="text-danger">*</span></label>
                        <input
                            type="date"
                            className="form-control"
                            id="goal-targetDate"
                            name="targetDate"
                            value={formData.targetDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{goalToEdit ? 'Save Changes' : 'Add Goal'}</button>
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
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    const axiosInstance = useMemo(() => createAxiosInstance(), []);

    const handleApiError = useCallback((error, context = "operation") => {
        let message = `Error during ${context}.`;
        if (error.response) {
            if (error.response.status === 401) {
                message = 'Session expired or invalid. Redirecting to login...';
                localStorage.removeItem('authToken');
                setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 2500);
            } else if (error.response.data) {
                if (typeof error.response.data === 'string' && error.response.data.length < 200) message = error.response.data;
                else if (error.response.data.message) message = error.response.data.message;
                else if (error.response.data.title) message = error.response.data.title;
                else if (error.response.data.error) message = error.response.data.error;
                else if (error.response.data.errors) {
                    const errors = error.response.data.errors;
                    const firstErrorField = Object.keys(errors)[0];
                    if (firstErrorField && errors[firstErrorField] && errors[firstErrorField].length > 0) {
                        message = `${firstErrorField}: ${errors[firstErrorField][0]}`;
                    } else {
                        message = `Validation error in ${firstErrorField}.`;
                    }
                } else {
                    message = `Server error (${error.response.status}) during ${context}.`;
                }
            }
        } else if (error.request) {
            message = `Network error during ${context}. Please check your connection.`;
        } else {
            message = error.message || `Unknown error during ${context}.`;
        }
        setPageError(message);
        console.error(`API Error (${context}):`, error);
    }, []);

    const fetchGoals = useCallback(async () => {
        setIsLoading(true);
        setPageError('');
        const token = getAuthToken();
        if (!token) {
            setPageError("Authentication required. Please log in.");
            setIsLoading(false);
            setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 2000);
            return;
        }
        try {
            const goals = await apiGetGoals(axiosInstance);
            setGoals(goals);
        } catch (error) {
            handleApiError(error, 'fetching goals');
        } finally {
            setIsLoading(false);
        }
    }, [axiosInstance, handleApiError]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleOpenAddGoalModal = () => {
        setGoalToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditGoalModal = (goal) => {
        setGoalToEdit(goal);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setGoalToEdit(null);
    };

    const handleSubmitGoal = async (goalData) => {
        setIsLoading(true);
        setPageError('');
        try {
            const payload = {
                goalName: goalData.goalName,
                description: goalData.description,
                goalType: goalData.goalType,
                targetAmount: parseFloat(goalData.targetAmount),
                targetDate: new Date(goalData.targetDate).toISOString(),
                priority: goalData.priority,
            };
            if (goalToEdit) {
                await apiUpdateGoal(axiosInstance, goalData.id, payload);
                alert('Goal updated successfully!');
            } else {
                await apiCreateGoal(axiosInstance, payload);
                alert('Goal added successfully!');
            }
            await fetchGoals();
            handleCloseModal();
        } catch (error) {
            handleApiError(error, 'saving goal');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            setIsLoading(true);
            setPageError('');
            try {
                await apiDeleteGoal(axiosInstance, goalId);
                alert('Goal deleted successfully!');
                await fetchGoals();
            } catch (error) {
                handleApiError(error, 'deleting goal');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const filteredGoals = goals.filter(goal => {
        if (filterType && goal.goalType !== filterType) return false;
        if (filterPriority && goal.priority !== filterPriority) return false;
        return true;
    });

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1 className="h2 mb-2 mb-md-0">Goals Management</h1>
                <button className="btn btn-primary" onClick={handleOpenAddGoalModal}>
                    <i className="bi bi-plus-circle-fill me-2"></i>Add Goal
                </button>
            </div>

            {isLoading && <div className="alert alert-info text-center">Loading data...</div>}
            {pageError && !isLoading && <div className="alert alert-danger text-center">{pageError}</div>}

            {!isLoading && !pageError && (goals.length > 0 || filterType || filterPriority) && (
                <div className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title mb-3">Filters</h5>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label htmlFor="filterType" className="form-label form-label-sm">Goal Type</label>
                                <select
                                    id="filterType"
                                    className="form-select form-select-sm"
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="Savings">Savings</option>
                                    <option value="Debt Repayment">Debt Repayment</option>
                                    <option value="Investment">Investment</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="filterPriority" className="form-label form-label-sm">Priority</label>
                                <select
                                    id="filterPriority"
                                    className="form-select form-select-sm"
                                    value={filterPriority}
                                    onChange={e => setFilterPriority(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="col-md-4 d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => {
                                        setFilterType('');
                                        setFilterPriority('');
                                    }}
                                >
                                    <i className="bi bi-x-lg me-1"></i>Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !pageError && (
                goals.length === 0 && !filterType && !filterPriority ? (
                    <div className="text-center p-5 border rounded bg-light">
                        <i className="bi bi-target" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                        <p className="mt-3 mb-2 text-muted">No goals have been set yet.</p>
                    </div>
                ) : filteredGoals.length === 0 && goals.length > 0 ? (
                    <div className="alert alert-warning text-center">No goals match the selected filters.</div>
                ) : filteredGoals.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">Goal Name</th>
                                    <th scope="col">Description</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Target Amount</th>
                                    <th scope="col">Target Date</th>
                                    <th scope="col">Priority</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGoals.map(goal => (
                                    <tr key={goal.id}>
                                        <td>{goal.goalName}</td>
                                        <td>{goal.description || '-'}</td>
                                        <td>{goal.goalType}</td>
                                        <td>{formatCurrency(goal.targetAmount)}</td>
                                        <td>{new Date(goal.targetDate).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            <span className={`badge ${goal.priority === 'High' ? 'bg-danger' : goal.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                                                {goal.priority}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-outline-secondary me-1 py-0 px-1"
                                                onClick={() => handleOpenEditGoalModal(goal)}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger py-0 px-1"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                title="Delete"
                                            >
                                                <i className="bi bi-trash3-fill"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null
            )}

            {isModalOpen && (
                <GoalFormModal
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitGoal}
                    goalToEdit={goalToEdit}
                />
            )}
        </div>
    );
};

export default GoalsManagement;