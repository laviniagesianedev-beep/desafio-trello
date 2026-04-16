import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import './AuthPages.css';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return (
      <div className="auth-container">
        <div className="auth-background">
          <div className="auth-shape shape-1" />
          <div className="auth-shape shape-2" />
        </div>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-text">Boardy</span>
            </div>
            <Title level={3} className="auth-title">Link inválido</Title>
            <Text className="auth-subtitle">
              Este link de redefinição parece estar inválido ou expirou.
            </Text>
            <div className="auth-footer" style={{ marginTop: 24 }}>
              <Link to="/login" className="auth-link">Voltar ao login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!password || password.length < 8) {
      message.warning('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== passwordConfirmation) {
      message.warning('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, password, passwordConfirmation, token);
      message.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch {
      message.error('Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-shape shape-1" />
        <div className="auth-shape shape-2" />
        <div className="auth-shape shape-3" />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-text">Boardy</span>
          </div>
          <Title level={3} className="auth-title">Nova senha</Title>
          <Text className="auth-subtitle">Informe sua nova senha para acessar a conta.</Text>
        </div>
        <div className="auth-form">
          <Input.Password
            size="large"
            prefix={<LockOutlined className="input-icon" />}
            placeholder="Nova senha (mínimo 8 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
          />
          <Input.Password
            size="large"
            prefix={<LockOutlined className="input-icon" />}
            placeholder="Confirmar nova senha"
            value={passwordConfirmation}
            onChange={e => setPasswordConfirmation(e.target.value)}
            onPressEnter={handleSubmit}
            className="auth-input"
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={loading}
            className="auth-button"
          >
            Redefinir senha
          </Button>
          <div className="auth-footer">
            <Link to="/login" className="auth-link">Voltar ao login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
