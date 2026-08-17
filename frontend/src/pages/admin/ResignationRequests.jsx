import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/dashboardLayout";
import ResignationApprovalModal from "./components/ResignationApprovalModal";
import "../../styles/dashboard.css"; // Reuse dashboard styles

const ResignationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/resignations", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.requests);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openModal = (req) => {
        setSelectedRequest(req);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedRequest(null);
        setIsModalOpen(false);
        fetchRequests(); // Refresh table on close
    };

    if (loading) return <DashboardLayout><div className="loading">Loading...</div></DashboardLayout>;

    const pendingCount = requests.filter(r => r.status === 'Submitted').length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;
    const completedCount = requests.filter(r => r.status === 'Completed').length;
    const cancelReqCount = requests.filter(r => r.status === 'Cancellation Requested').length;

    return (
        <DashboardLayout>
            <div className="dashboard-container" style={{ padding: '20px' }}>
                <h1 style={{ marginBottom: '20px' }}>Resignation Requests</h1>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                        <h3>Pending</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{pendingCount}</p>
                    </div>
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                        <h3>Approved</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{approvedCount}</p>
                    </div>
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                        <h3>Rejected</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{rejectedCount}</p>
                    </div>
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                        <h3>Completed</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{completedCount}</p>
                    </div>
                    <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                        <h3>Cancel Reqs</h3>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{cancelReqCount}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="card" style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px' }}>Employee</th>
                                <th style={{ padding: '12px' }}>Department</th>
                                <th style={{ padding: '12px' }}>Submitted</th>
                                <th style={{ padding: '12px' }}>Last Working Day</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{req.first_name} {req.last_name}</td>
                                    <td style={{ padding: '12px' }}>{req.department}</td>
                                    <td style={{ padding: '12px' }}>{new Date(req.submitted_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>{new Date(req.last_working_day).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '12px',
                                            backgroundColor: req.status === 'Submitted' ? '#f59e0b' : 
                                                             req.status === 'Approved' ? '#3b82f6' : 
                                                             req.status === 'Rejected' ? '#ef4444' : 
                                                             req.status === 'Cancellation Requested' ? '#8b5cf6' : 
                                                             req.status === 'Cancelled' ? '#6b7280' : '#10b981',
                                            color: 'white'
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => openModal(req)}
                                            style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No resignation requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ResignationApprovalModal 
                    request={selectedRequest} 
                    onClose={closeModal} 
                />
            )}
        </DashboardLayout>
    );
};

export default ResignationRequests;
