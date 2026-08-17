import React, { useEffect, useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { FaSearch } from "react-icons/fa";

const fetcher = (url) => axios.get(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(res => res.data);

function ReportFilters({ reportType, filters, onFilterChange, onReset }) {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const user = JSON.parse(localStorage.getItem("user:v1")) || {};
    const role = user.role || "Employee";


    const { data: deptData } = useSWR("http://localhost:5000/api/departments", fetcher);
    const { data: empData } = useSWR(role !== "Employee" ? "http://localhost:5000/api/employees" : null, fetcher);

    useEffect(() => {
        if (deptData) setDepartments(deptData || []);
        if (empData && empData.success) setEmployees(empData.employees);
    }, [deptData, empData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    return (
        <div className="reports-filters-card">
            {/* Row 1 Grid: Search, Department, Status, Type */}
            <div className="filters-grid-row">
                {/* Search Bar */}
                {reportType !== "departments" ? (
                    <div className="filter-field">
                        <label>Search</label>
                        <div className="filter-input-wrapper">
                            <span className="material-symbols-outlined filter-input-icon">search</span>
                            <input
                                aria-label="Search"
                                type="text"
                                name="search"
                                value={filters.search || ""}
                                onChange={handleChange}
                                placeholder="Name, ID, Title..."
                                className="filter-input has-icon"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="filter-field">
                        <label>Search</label>
                        <input
                            aria-label="Search"
                            type="text"
                            name="search"
                            value={filters.search || ""}
                            onChange={handleChange}
                            placeholder="Department Name..."
                            className="filter-input"
                        />
                    </div>
                )}

                {/* Department Dropdown */}
                {role === "Admin" ? (
                    <div className="filter-field">
                        <label>Department</label>
                        <select aria-label="Filter by department" name="department" value={filters.department || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Departments</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.department_name}>{d.department_name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="filter-field">
                        <label>Department</label>
                        <input
                            aria-label="Department"
                            type="text"
                            value={user.department || ""}
                            className="filter-input"
                            disabled
                            style={{ backgroundColor: "#e7e7f3", color: "#585f6c", cursor: "not-allowed" }}
                        />
                    </div>
                )}

                {/* Status Dropdown */}
                <div className="filter-field">
                    <label>Status</label>
                    {reportType === "employees" && (
                        <select aria-label="Filter by status" name="status" value={filters.status || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    )}
                    {reportType === "tasks" && (
                        <select aria-label="Filter by status" name="status" value={filters.status || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    )}
                    {reportType === "leaves" && (
                        <select aria-label="Filter by status" name="status" value={filters.status || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    )}
                    {reportType === "attendance" && (
                        <select aria-label="Filter by status" name="status" value={filters.status || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Statuses</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                        </select>
                    )}
                    {reportType === "departments" && (
                        <input
                            aria-label="Filter by status"
                            type="text"
                            value="All Statuses"
                            className="filter-input"
                            disabled
                            style={{ backgroundColor: "#e7e7f3", color: "#585f6c", cursor: "not-allowed" }}
                        />
                    )}
                </div>

                {/* Type Dropdown */}
                <div className="filter-field">
                    <label>Type</label>
                    {reportType === "employees" ? (
                        <select aria-label="Filter by employment type" name="employment_type" value={filters.employment_type || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Types</option>
                            <option value="Full Time">Full-Time</option>
                            <option value="Part Time">Part-Time</option>
                            <option value="Contract">Contract</option>
                        </select>
                    ) : reportType === "tasks" ? (
                        <select aria-label="Filter by priority" name="priority" value={filters.priority || ""} onChange={handleChange} className="filter-select">
                            <option value="">All Priorities</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    ) : (
                        <select aria-label="Filter by type" className="filter-select" disabled style={{ backgroundColor: "#e7e7f3", color: "#585f6c", cursor: "not-allowed" }}>
                            <option>All Types</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Row 2 Grid: From Date, To Date, Sort Order, Reset Button */}
            <div className="filters-grid-row" style={{ alignItems: "end" }}>
                {/* From Date */}
                <div className="filter-field">
                    <label>From Date</label>
                    <input
                        aria-label="From Date"
                        type="date"
                        name="from"
                        value={filters.from || ""}
                        onChange={handleChange}
                        className="filter-input"
                    />
                </div>

                {/* To Date */}
                <div className="filter-field">
                    <label>To Date</label>
                    <input
                        aria-label="To Date"
                        type="date"
                        name="to"
                        value={filters.to || ""}
                        onChange={handleChange}
                        className="filter-input"
                    />
                </div>

                {/* Sort Order */}
                <div className="filter-field">
                    <label>Sort Order</label>
                    <select aria-label="Sort Order" name="sort" value={filters.sort || "DESC"} onChange={handleChange} className="filter-select">
                        <option value="DESC">Latest First</option>
                        <option value="ASC">Oldest First</option>
                    </select>
                </div>

                {/* Reset Action */}
                <div className="filter-field">
                    <button type="button" className="btn-filter-reset" onClick={onReset}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>restart_alt</span>
                        Reset Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReportFilters;
