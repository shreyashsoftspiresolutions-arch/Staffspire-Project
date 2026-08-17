import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/dashboardLayout";
import "../../styles/dashboard.css"; // Reuse dashboard card styles

const Resignation = () => {
    const [resignationData, setResignationData] = useState(null);
    const [activeWork, setActiveWork] = useState({ activeTasks: 0, activeProjects: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

    const openConfirmDialog = (title, message, onConfirm) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    // Form state
    const [formData, setFormData] = useState({
        reason: "",
        lastWorkingDay: "",
        noticePeriodDays: 30,
        reviewComments: ""
    });

    const fetchResignation = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/resignations/employee", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setResignationData(data.request);
                setActiveWork(data.activeWork || { activeTasks: 0, activeProjects: 0 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResignation();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/resignations", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    reason: formData.reason,
                    last_working_day: formData.lastWorkingDay,
                    notice_period_days: formData.noticePeriodDays,
                    review_comments: formData.reviewComments
                })
            });
            const data = await response.json();
            if (data.success) {
                setSuccess("Resignation submitted successfully.");
                fetchResignation();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to submit resignation.");
        }
    };

    const handleWithdraw = (id) => {
        openConfirmDialog(
            "Withdraw Resignation",
            "Are you sure you want to withdraw your resignation request?",
            async () => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`http://localhost:5000/api/resignations/${id}/withdraw`, {
                        method: "PUT",
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setSuccess("Resignation withdrawn.");
                        fetchResignation();
                    } else {
                        setError(data.message);
                    }
                } catch (err) {
                    setError("Failed to withdraw resignation.");
                }
                closeConfirmDialog();
            }
        );
    };

    const handleRequestCancellation = (id) => {
        openConfirmDialog(
            "Request Cancellation",
            "Are you sure you want to request cancellation of your approved resignation?",
            async () => {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`http://localhost:5000/api/resignations/${id}/request-cancellation`, {
                        method: "PUT",
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setSuccess("Cancellation requested successfully.");
                        fetchResignation();
                    } else {
                        setError(data.message);
                    }
                } catch (err) {
                    setError("Failed to request cancellation.");
                }
                closeConfirmDialog();
            }
        );
    };

    if (loading) return <DashboardLayout><div className="loading">Loading...</div></DashboardLayout>;

    // Calculate days remaining if approved
    let daysRemaining = null;
    if (resignationData && resignationData.status === 'Approved') {
        const lwd = new Date(resignationData.last_working_day);
        const today = new Date();
        const diffTime = Math.max(0, lwd - today);
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return (
        <DashboardLayout>
            <div className="dashboard-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

                {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
                {success && <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>{success}</div>}

                {resignationData && resignationData.status !== 'Withdrawn' && resignationData.status !== 'Rejected' && resignationData.status !== 'Cancelled' ? (
                    // Display Active Resignation
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)' }}>
                        <h2 style={{ marginBottom: '15px' }}>Active Resignation Request</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <strong>Status:</strong> <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white' }}>{resignationData.status}</span>
                            </div>
                            <div>
                                <strong>Last Working Day:</strong> {new Date(resignationData.last_working_day).toLocaleDateString()}
                            </div>
                            {daysRemaining !== null && (
                                <div>
                                    <strong>Days Remaining:</strong> {daysRemaining}
                                </div>
                            )}
                            <div>
                                <strong>Reason:</strong> {resignationData.reason}
                            </div>
                        </div>

                        {resignationData.status === 'Submitted' && (
                            <button 
                                onClick={() => handleWithdraw(resignationData.id)}
                                style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Withdraw Resignation
                            </button>
                        )}
                        
                        {resignationData.status === 'Approved' && (
                            <button 
                                onClick={() => handleRequestCancellation(resignationData.id)}
                                style={{ marginTop: '20px', padding: '10px 15px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Request Cancellation
                            </button>
                        )}
                        
                        {resignationData.review_comments && (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '5px' }}>
                                <strong>Review Comments:</strong>
                                <p style={{ marginTop: '5px' }}>{resignationData.review_comments}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Application Form
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)' }}>
                        <h2 style={{ marginBottom: '15px' }}>Apply for Resignation</h2>
                        
                        {(activeWork.activeTasks > 0 || activeWork.activeProjects > 0) && (
                            <div style={{ padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '5px', marginBottom: '20px' }}>
                                <strong>Active Work Warning:</strong> You currently have:
                                <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                                    {activeWork.activeTasks > 0 && <li>{activeWork.activeTasks} Active Task(s)</li>}
                                    {activeWork.activeProjects > 0 && <li>{activeWork.activeProjects} Active Project(s)</li>}
                                </ul>
                                These should be completed or reassigned before your last working day.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Reason</label>
                                <select 
                                    name="reason" 
                                    value={formData.reason} 
                                    onChange={handleChange} 
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Higher Education">Higher Education</option>
                                    <option value="Career Growth">Career Growth</option>
                                    <option value="Relocation">Relocation</option>
                                    <option value="Health">Health</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Notice Period (Days)</label>
                                    <input 
                                        type="number" 
                                        name="noticePeriodDays" 
                                        value={formData.noticePeriodDays} 
                                        onChange={handleChange} 
                                        required
                                        min="1"
                                        max="365"
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Last Working Day</label>
                                    <input 
                                        type="date" 
                                        name="lastWorkingDay" 
                                        value={formData.lastWorkingDay} 
                                        onChange={handleChange} 
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Additional Comments (Optional)</label>
                                <textarea 
                                    name="reviewComments" 
                                    value={formData.reviewComments} 
                                    onChange={handleChange} 
                                    rows="4"
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                style={{ padding: '12px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                            >
                                Submit Resignation
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            {confirmDialog.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', padding: '25px', borderRadius: '10px',
                        width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#111827' }}>{confirmDialog.title}</h3>
                        <p style={{ marginBottom: '25px', color: '#374151', lineHeight: '1.5' }}>{confirmDialog.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                onClick={closeConfirmDialog}
                                style={{ padding: '8px 16px', borderRadius: '5px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'transparent', color: '#374151', fontWeight: '500' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDialog.onConfirm}
                                style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Resignation;
