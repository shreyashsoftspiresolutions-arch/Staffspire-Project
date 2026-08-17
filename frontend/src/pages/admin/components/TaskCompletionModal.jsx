import React, { useState } from 'react';
import { FaTimes, FaUpload, FaGithub, FaLink } from 'react-icons/fa';

function TaskCompletionModal({ isOpen, onClose, onSubmit, isSubmitting }) {
    const [summary, setSummary] = useState('');
    const [notes, setNotes] = useState('');
    const [evidenceType, setEvidenceType] = useState('Attachments');
    
    // GitHub fields
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('');
    const [commitHash, setCommitHash] = useState('');
    const [prUrl, setPrUrl] = useState('');
    
    // Demo
    const [demoUrl, setDemoUrl] = useState('');
    
    // Files
    const [files, setFiles] = useState([]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('summary', summary);
        formData.append('notes', notes);
        formData.append('evidence_type', evidenceType);
        
        if (evidenceType === 'GitHub Repository') {
            formData.append('repository_url', repoUrl);
            formData.append('branch_name', branch);
            formData.append('commit_hash', commitHash);
            formData.append('pull_request_url', prUrl);
        } else if (evidenceType === 'Live Demo') {
            formData.append('demo_url', demoUrl);
        }
        
        if (evidenceType === 'Attachments' || evidenceType === 'GitHub Repository') {
            for (let i = 0; i < files.length; i++) {
                formData.append('attachments', files[i]);
            }
        }

        onSubmit(formData);
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "white", width: "100%", maxWidth: "600px", borderRadius: "20px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                        Submit Task Evidence
                    </h2>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "50%" }} onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                        <FaTimes size={18} />
                    </button>
                </div>

                <div style={{ padding: "24px", overflowY: "auto" }}>
                    <form id="completion-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Summary *</label>
                            <input required type="text" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Briefly summarize what was completed" style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Completion Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" placeholder="Any specific details, blockers resolved, or notes for the reviewer..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", resize: "vertical" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Evidence Type</label>
                            <select value={evidenceType} onChange={e => setEvidenceType(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", backgroundColor: "#fff" }}>
                                <option value="Attachments">Attachments (Files/Images)</option>
                                <option value="GitHub Repository">GitHub Repository / Code</option>
                                <option value="Live Demo">Live Demo / URL</option>
                                <option value="Notes Only">Notes Only</option>
                            </select>
                        </div>

                        {evidenceType === 'GitHub Repository' && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: "600" }}><FaGithub /> GitHub Evidence</div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "#475569" }}>Repository URL</label>
                                    <input type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/..." style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "#475569" }}>Branch Name</label>
                                    <input type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "#475569" }}>Commit Hash</label>
                                    <input type="text" value={commitHash} onChange={e => setCommitHash(e.target.value)} placeholder="7a8c9b2" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "#475569" }}>Pull Request URL</label>
                                    <input type="url" value={prUrl} onChange={e => setPrUrl(e.target.value)} placeholder="PR Link" style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem" }} />
                                </div>
                            </div>
                        )}

                        {evidenceType === 'Live Demo' && (
                            <div style={{ padding: "16px", background: "#f0fdfa", borderRadius: "8px", border: "1px solid #ccfbf1" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#115e59", fontWeight: "600", marginBottom: "12px" }}><FaLink /> Demo Link</div>
                                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.8rem", color: "#0f766e" }}>URL</label>
                                <input required type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://myapp-demo.com" style={{ width: "100%", padding: "8px 12px", border: "1px solid #99f6e4", borderRadius: "6px", fontSize: "0.9rem" }} />
                            </div>
                        )}

                        {(evidenceType === 'Attachments' || evidenceType === 'GitHub Repository') && (
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.875rem", fontWeight: "600", color: "#334155" }}>Upload Files (Screenshots, PDFs, etc.)</label>
                                <div style={{ border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "20px", textAlign: "center", background: "#f8fafc" }}>
                                    <input type="file" multiple id="file-upload" onChange={e => setFiles(Array.from(e.target.files))} style={{ display: "none" }} />
                                    <label htmlFor="file-upload" style={{ cursor: "pointer", display: "inline-flex", flexDirection: "column", alignItems: "center", color: "#64748b" }}>
                                        <FaUpload size={24} style={{ marginBottom: "8px", color: "#94a3b8" }} />
                                        <span style={{ fontWeight: "600", color: "#2563eb" }}>Click to upload</span>
                                        <span style={{ fontSize: "0.8rem", marginTop: "4px" }}>or drag and drop</span>
                                    </label>
                                    {files.length > 0 && (
                                        <div style={{ marginTop: "16px", textAlign: "left", fontSize: "0.85rem", color: "#334155" }}>
                                            <strong>Selected Files:</strong>
                                            <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
                                                {files.map((f, i) => <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px", background: "#f8fafc" }}>
                    <button type="button" onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #cbd5e1", background: "white", borderRadius: "8px", fontWeight: "600", color: "#475569", cursor: "pointer" }}>
                        Cancel
                    </button>
                    <button type="submit" form="completion-form" disabled={isSubmitting} style={{ padding: "10px 24px", border: "none", background: "var(--primary, #2563eb)", color: "white", borderRadius: "8px", fontWeight: "600", cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                        {isSubmitting ? "Submitting..." : "Submit Evidence"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TaskCompletionModal;
