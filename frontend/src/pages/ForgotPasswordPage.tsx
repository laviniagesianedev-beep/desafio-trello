import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Typography, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import './AuthPages.css';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      message.warning('Informe seu email');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      message.success('Instruções enviadas para seu email');
    } catch {
      message.error('Erro ao enviar. Verifique o email.');
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
          <Title level={3} className="auth-title">Recuperar senha</Title>
          <Text className="auth-subtitle">
            {sent
              ? 'Verifique sua caixa de entrada para redefinir sua senha.'
              : 'Informe o email da sua conta para receber instruções de recuperação.'}
          </Text>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary">Não recebeu? Verifique a caixa de spam ou </Text>
            <Link to="/login">volte ao login</Link>
          </div>
        ) : (
          <div className="auth-form">
            <Input
              size="large"
              prefix={<MailOutlined className="input-icon" />}
              placeholder="Seu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              Enviar instruções
            </Button>
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Voltar ao login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
