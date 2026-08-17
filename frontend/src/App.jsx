import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import Login from "./auth/login";

import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Solutions from "./pages/public/Solutions";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeList from "./pages/admin/EmployeeList";
import AddEmployee from "./pages/admin/AddEmployee";
import EmployeeDetails from "./pages/admin/EmployeeDetails";
import ChangePassword from "./pages/admin/changePassword";
import Settings from "./pages/settings/settings";
import ForgotPassword from "./auth/forgotPassword";
import VerifyOTP from "./auth/VerifyOTP";
import ResetPassword from "./auth/ResetPassword";
import RegisterAdmin from "./auth/RegisterAdmin";
import Departments from "./pages/admin/Departments";
import DepartmentDetails from "./pages/admin/DepartmentDetails";
import MyProfile from "./pages/employee/MyProfile";
import Attendance from "./pages/employee/Attendance";
import AttendanceList from "./pages/admin/AttendanceList";
import LeaveDashboard from "./pages/employee/LeaveDashboard";
import LeaveRequestsList from "./pages/admin/LeaveRequestsList";
import LeaveRequestDetail from "./pages/admin/LeaveRequestDetail";
import AdminTaskList from "./pages/admin/AdminTaskList";
import TaskDetail from "./pages/admin/TaskDetail";
import MyTasks from "./pages/employee/MyTasks";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import AlertsShowcase from "./pages/admin/AlertsShowcase";
import ProjectDashboard from "./pages/admin/ProjectDashboard";
import Projects from "./pages/admin/Projects";
import ProjectDetails from "./pages/admin/ProjectDetails";
import ResignationRequests from "./pages/admin/ResignationRequests";
import Resignation from "./pages/employee/Resignation";

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/features"
                    element={<Features />}
                />

                <Route
                    path="/solutions"
                    element={<Solutions />}
                />

                <Route
                    path="/about"
                    element={<About />}
                />

                <Route
                    path="/contact"
                    element={<Contact />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/admin/employees"
                    element={<EmployeeList />}
                />

                <Route
                    path="/admin/attendance"
                    element={<AttendanceList />}
                />

                <Route
                    path="/admin/leaves"
                    element={<LeaveRequestsList />}
                />

                <Route
                    path="/admin/leaves/:id"
                    element={<LeaveRequestDetail />}
                />

                <Route
                    path="/admin/tasks"
                    element={<AdminTaskList />}
                />

                <Route
                    path="/admin/tasks/:id"
                    element={<TaskDetail />}
                />

                <Route
                    path="/admin/projects/dashboard"
                    element={<ProjectDashboard />}
                />

                <Route
                    path="/admin/projects"
                    element={<Projects />}
                />
                <Route
                    path="/admin/projects/:id"
                    element={<ProjectDetails />}
                />
                <Route
                    path="/admin/resignations"
                    element={<ResignationRequests />}
                />
                <Route
                    path="/employee/projects"
                    element={<Projects />}
                />
                <Route
                    path="/employee/projects/:id"
                    element={<ProjectDetails />}
                />

                <Route
                    path="/employee/tasks"
                    element={<MyTasks />}
                />

                <Route
                    path="/employee/tasks/:id"
                    element={<TaskDetail />}
                />

                <Route
                    path="/manager/dashboard"
                    element={<ManagerDashboard />}
                />

                <Route
                    path="/employee/dashboard"
                    element={<EmployeeDashboard />}
                />
                <Route
                    path="/employee/leaves"
                    element={<LeaveDashboard />}
                />
                <Route
                    path="/employee/resignation"
                    element={<Resignation />}
                />
                <Route
                    path="/employee/profile"
                    element={<MyProfile />}
                />
                <Route
                    path="/employee/attendance"
                    element={<Attendance />}
                />
                <Route
                    path="/admin/employees/add"
                    element={<AddEmployee />}
                />
                <Route
                    path="/admin/employees/:id"
                    element={<EmployeeDetails />}
                />
                <Route
                    path="/change-password"
                    element={<ChangePassword />}
                />
                <Route
                    path="/settings"
                    element={<Settings />}
                />
                <Route
                    path="/reports"
                    element={<ReportsDashboard />}
                />
                <Route
                    path="/alerts"
                    element={<AlertsShowcase />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />
                <Route
                    path="/verify-otp"
                    element={<VerifyOTP />}
                />

                <Route
                    path="/register-admin"
                    element={<RegisterAdmin />}
                />
                <Route
                    path="/admin/departments"
                    element={<Departments />}
                />
                <Route
                    path="/admin/departments/:id"
                    element={<DepartmentDetails />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;