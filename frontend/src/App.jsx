import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import ProfileComponent from './components/profile/ProfileComponent'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function AuthenticatedRoute({ children }) {
  /// const user = localStorage.getItem('access_token')
  const user = sessionStorage.getItem('access_token');
  if (!user) {
    return <Navigate to="/" replace/>;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <AuthenticatedRoute>
            <Dashboard />
          </AuthenticatedRoute>
        }></Route>
        <Route path="/profile" element={
          <AuthenticatedRoute>
            <ProfileComponent />
          </AuthenticatedRoute>
        }></Route>
      </Routes>
      <ToastContainer 
      position="top-center"
        autoClose={1000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        />
    </Router>
  );
}