// frontend/src/App.jsx
import { HashRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import PortalLayout from "./layouts/PortalLayout";

// Public pages
import Home from "./pages/public/Home";
import Services from "./pages/public/Services";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import PartyPackages from "./pages/public/PartyPackages";
import ClassDetails from "./pages/public/ClassDetails";
import PlayArea from "./pages/public/PlayArea";
import PaymentCard from "./pages/public/PaymentCard";
import PaymentCash from "./pages/public/PaymentCash";
import PaymentBankTransfer from "./pages/public/PaymentBankTransfer";

import Profile from "./pages/public/Profile";
import CreateBooking from "./pages/public/CreateBooking";
import EnrollClasses from "./pages/public/EnrollClasses";
import PayNow from "./pages/public/PayNow";

// Auth pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ChangePassword from "./pages/auth/ChangePassword";

// Admin
import AdminSignIn from "./pages/admin/AdminSignIn";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPayments from "./pages/admin/Payments";
import AdminReservations from "./pages/admin/Reservations";
import AdminEventsClasses from "./pages/admin/EventsClasses";
import AdminPlayArea from "./pages/admin/PlayArea";
import AdminInquiries from "./pages/admin/Inquiries";

// Receptionist
import RecDashboard from "./pages/reception/Dashboard";
import RecBookings from "./pages/reception/Bookings";
import RecManualBooking from "./pages/reception/ManualBooking";
import RecCashPayments from "./pages/reception/CashPayments";
import RecEnrollment from "./pages/reception/Enrollment";
import RecInquiries from "./pages/reception/Inquiries";
import RecBankTransfers from "./pages/reception/BankTransfers";

// Instructor
import InsDashboard from "./pages/instructor/Dashboard";
import InsAssignedClasses from "./pages/instructor/AssignedClasses";
import InsEnrolledChildren from "./pages/instructor/EnrolledChildren";
import InsMarkAttendance from "./pages/instructor/MarkAttendance";
import InsAttendanceRecords from "./pages/instructor/AttendanceRecords";

const adminMenu = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/payments", label: "Manage Payments" },
  { to: "/admin/reservations", label: "Manage Reservation" },
  { to: "/admin/events", label: "Manage Events/Classes" },
  { to: "/admin/play-area", label: "Manage Play Area" },
  { to: "/admin/inquiries", label: "Customer Inquiry" },
];

const receptionMenu = [
  { to: "/reception/dashboard", label: "Dashboard" },
  { to: "/reception/bookings", label: "View Bookings" },
  { to: "/reception/manual-booking", label: "Add Manual Booking" },
  { to: "/reception/cash-payments", label: "Update Cash Payments" },
  { to: "/reception/bank-transfers", label: "Approve Bank Transfers" },
  { to: "/reception/enrollment", label: "Manage Enrollment" },
  { to: "/reception/inquiries", label: "Customer Inquiry" },
];

const instructorMenu = [
  { to: "/instructor/dashboard", label: "Dashboard" },
  { to: "/instructor/assigned-classes", label: "View Assigned Classes" },
  { to: "/instructor/enrolled-children", label: "View Enrolled Children" },
  { to: "/instructor/mark-attendance", label: "Mark Attendance" },
  { to: "/instructor/attendance-records", label: "View Attendance Records" },
];

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public website layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/party-packages" element={<PartyPackages />} />
            <Route path="/classes" element={<ClassDetails />} />
            <Route path="/play-area" element={<PlayArea />} />

            {/* Payment screens (UI only) */}
            <Route path="/pay/card" element={<PaymentCard />} />
            <Route path="/pay/cash" element={<PaymentCash />} />
            <Route path="/pay/bank-transfer" element={<PaymentBankTransfer />} />

            {/* Parent routes inside PublicLayout to keep navbar */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["PARENT"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/book"
              element={
                <ProtectedRoute allowedRoles={["PARENT"]}>
                  <CreateBooking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/enroll"
              element={
                <ProtectedRoute allowedRoles={["PARENT"]}>
                  <EnrollClasses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/pay/:enrollmentId"
              element={
                <ProtectedRoute allowedRoles={["PARENT"]}>
                  <PayNow />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Auth */}
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Change password (JWT required, any role) */}
          <Route
            path="/auth/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Staff portal sign in */}
          <Route path="/admin/signin" element={<AdminSignIn />} />

          {/* Admin portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <PortalLayout menuTitle="Admin Dashboard" items={adminMenu} />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reservations" element={<AdminReservations />} />
            <Route path="/admin/events" element={<AdminEventsClasses />} />
            <Route path="/admin/play-area" element={<AdminPlayArea />} />
            <Route path="/admin/inquiries" element={<AdminInquiries />} />
          </Route>

          {/* Receptionist portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
                <PortalLayout menuTitle="Receptionist Dashboard" items={receptionMenu} />
              </ProtectedRoute>
            }
          >
            <Route path="/reception/dashboard" element={<RecDashboard />} />
            <Route path="/reception/bookings" element={<RecBookings />} />
            <Route path="/reception/manual-booking" element={<RecManualBooking />} />
            <Route path="/reception/cash-payments" element={<RecCashPayments />} />
            <Route path="/reception/bank-transfers" element={<RecBankTransfers />} />
            <Route path="/reception/enrollment" element={<RecEnrollment />} />
            <Route path="/reception/inquiries" element={<RecInquiries />} />
          </Route>

          {/* Instructor portal */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["INSTRUCTOR"]}>
                <PortalLayout menuTitle="Instructor Dashboard" items={instructorMenu} />
              </ProtectedRoute>
            }
          >
            <Route path="/instructor/dashboard" element={<InsDashboard />} />
            <Route path="/instructor/assigned-classes" element={<InsAssignedClasses />} />
            <Route path="/instructor/enrolled-children" element={<InsEnrolledChildren />} />
            <Route path="/instructor/mark-attendance" element={<InsMarkAttendance />} />
            <Route path="/instructor/attendance-records" element={<InsAttendanceRecords />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<div style={{ padding: 20 }}>404</div>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}