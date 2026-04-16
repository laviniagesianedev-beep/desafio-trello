import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { boardyTheme } from './theme/boardyTheme';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import './App.css';

function App() {
  const { token } = useAuthStore();

  return (
    <ConfigProvider theme={boardyTheme}>
      <Router>
        <div className="app">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route 
              path="/login" 
              element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
            />
            
            {/* Rotas protegidas */}
            <Route 
              path="/dashboard" 
              element={token ? <DashboardPage /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/board/:id" 
              element={token ? <BoardPage /> : <Navigate to="/login" replace />} 
            />
            
            {/* Redirecionamento padrão */}
            <Route 
              path="/" 
              element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
            />
            <Route 
              path="*" 
              element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;