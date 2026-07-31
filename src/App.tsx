import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Overview from "@/pages/Overview";
import Classes from "@/pages/Classes";
import Subjects from "@/pages/Subjects";
import Teachers from "@/pages/Teachers";
import Students from "@/pages/Students";
import Attendance from "@/pages/Attendance";
import Grades from "@/pages/Grades";
import Fees from "@/pages/Fees";
import Announcements from "@/pages/Announcements";

function Unauthorized() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-950 text-center px-4">
      <p className="text-6xl mb-4">🔒</p>
      <h1 className="text-2xl font-bold text-white">Access Denied</h1>
      <p className="mt-2 text-gray-400 text-sm">
        You don't have permission to view this page.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AcademicYearProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes — any authenticated user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<Overview />} />
                <Route path="classes" element={<Classes />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="students" element={<Students />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="grades" element={<Grades />} />
                <Route path="fees" element={<Fees />} />
                <Route path="announcements" element={<Announcements />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AcademicYearProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}