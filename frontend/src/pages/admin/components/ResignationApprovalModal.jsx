import React, { useState } from "react";

const ResignationApprovalModal = ({ request, onClose }) => {
    const [reviewComments, setReviewComments] = useState(request.review_comments || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAction = async (status) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/resignations/${request.id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status, review_comments: reviewComments })
            });
            const data = await response.json();
            if (data.success) {
                onClose(); // This also refreshes the table
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to update status.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#fff', padding: '25px', borderRadius: '10px',
                width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none',
                    fontSize: '20px', cursor: 'pointer', color: '#666'
                }}>&times;</button>

                <h2 style={{ marginBottom: '20px' }}>Resignation Request Review</h2>

                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                {/* Employee Summary Card */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                    <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Employee Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div><strong>Name:</strong> {request.first_name} {request.last_name}</div>
                        <div><strong>Department:</strong> {request.department}</div>
                        <div><strong>Joining Date:</strong> {new Date(request.joining_date).toLocaleDateString()}</div>
                        <div><strong>Active Tasks:</strong> {request.activeTasks}</div>
                        <div><strong>Active Projects:</strong> {request.activeProjects}</div>
                    </div>
                </div>

                {/* Request Details */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Request Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                        <div><strong>Reason:</strong> {request.reason}</div>
                        <div><strong>Submitted:</strong> {new Date(request.submitted_at).toLocaleDateString()}</div>
                        <div><strong>Notice Period:</strong> {request.notice_period_days} days</div>
                        <div><strong>Last Working Day:</strong> {new Date(request.last_working_day).toLocaleDateString()}</div>
                        <div>
                            <strong>Status:</strong> 
                            <span style={{ marginLeft: '5px', fontWeight: 'bold', color: request.status === 'Submitted' ? '#f59e0b' : request.status === 'Approved' ? '#3b82f6' : request.status === 'Rejected' ? '#ef4444' : request.status === 'Cancellation Requested' ? '#8b5cf6' : request.status === 'Cancelled' ? '#6b7280' : '#10b981' }}>
                                {request.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Review Comments (Visible to Employee)</label>
                    <textarea 
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        rows="4"
                        disabled={request.status !== 'Submitted' && request.status !== 'Cancellation Requested'}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        placeholder="Add comments regarding the approval or rejection..."
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer', background: 'white' }}>
                        Close
                    </button>
                    {request.status === 'Submitted' && (
                        <>
                            <button 
                                onClick={() => handleAction('Rejected')} 
                                disabled={loading}
                                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white' }}
                            >
                                Reject
                            </button>
                            <button 
                                onClick={() => handleAction('Approved')} 
                                disabled={loading}
                                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#10b981', color: 'white' }}
                            >
                                Approve
                            </button>
                        </>
                    )}
                    {request.status === 'Cancellation Requested' && (
                        <>
                            <button 
                                onClick={() => handleAction('Approved')} 
                                disabled={loading}
                                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white' }}
                            >
                                Reject Cancellation
                            </button>
                            <button 
                                onClick={() => handleAction('Cancelled')} 
                                disabled={loading}
                                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#8b5cf6', color: 'white' }}
                            >
                                Approve Cancellation
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResignationApprovalModal;
