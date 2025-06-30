import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UserManagementPage from './pages/UserManagementPage';
import PropertyManagementPage from './pages/PropertyManagementPage';
import VillageManagementPage from './pages/VillageManagementPage';
import UserVillageAssignmentPage from './pages/UserVillageAssignmentPage';
import EmergencyOverridePage from './pages/EmergencyOverridePage';
import { Toaster } from 'sonner';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main App Content with Router
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users-management" element={<UserManagementPage />} />
        <Route path="village-management" element={<VillageManagementPage />} />
        <Route path="user-village-assignment" element={<UserVillageAssignmentPage />} />
        <Route path="emergency-override" element={<EmergencyOverridePage />} />
        <Route path="properties" element={<PropertyManagementPage />} />
        <Route 
          path="financial-management" 
          element={
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Financial Management</h1>
                <p className="text-gray-600 mb-4">Coming soon in Phase 4...</p>
              </div>
            </div>
          } 
        />
        <Route 
          path="reports-analytics" 
          element={
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
                <p className="text-gray-600 mb-4">Coming soon in Phase 4...</p>
              </div>
            </div>
          } 
        />
        <Route 
          path="settings" 
          element={
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">System Settings</h1>
                <p className="text-gray-600 mb-4">Coming soon in Phase 4...</p>
              </div>
            </div>
          } 
        />
        <Route 
          path="help-support" 
          element={
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
                <p className="text-gray-600 mb-4">Coming soon in Phase 4...</p>
              </div>
            </div>
          } 
        />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

