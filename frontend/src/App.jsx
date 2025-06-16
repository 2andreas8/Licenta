import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import ProfileComponent from './components/profile/ProfileComponent'
import ChatContainer from './components/chat/ChatContainer';
import Layout from './components/layout/Layout';
import StatisticsPageComponent from './components/statistics/StatisticsPageComponent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser } from './services/authService';
import { useState, useEffect } from 'react';
import './index.css';
import { initSummaryHandler } from './services/summaryService';

function AuthenticatedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => setValid(true))
      .catch(() => setValid(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    initSummaryHandler();
  }, []);

  if(loading) return <div>Loading...</div>;
  if(!valid) return <Navigate to="/?session_expired=1" replace />;
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
            <Layout>
              <Dashboard />
            </Layout>
          </AuthenticatedRoute>
        }></Route>
        <Route path="/profile" element={
          <AuthenticatedRoute>
            <Layout>
              <ProfileComponent />
            </Layout>
          </AuthenticatedRoute>
        }></Route>
        <Route path="/chat/:conversationId" element={
          <AuthenticatedRoute>
            <Layout>
              <ChatContainer />
            </Layout>
          </AuthenticatedRoute>
        }></Route>
        <Route path="/statistics" element={
          <AuthenticatedRoute>
            <Layout>
              <StatisticsPageComponent />
            </Layout>
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