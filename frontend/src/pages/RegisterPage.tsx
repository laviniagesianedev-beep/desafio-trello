import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Divider, message, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import './AuthPages.css';

const { Title, Text } = Typography;

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { login, setError, clearError } = useAuthStore();

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(Math.min(strength, 100));
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Muito fraca';
    if (passwordStrength < 50) return 'Fraca';
    if (passwordStrength < 75) return 'Razoável';
    if (passwordStrength < 100) return 'Forte';
    return 'Muito forte';
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return '#FFAAA5';
    if (passwordStrength < 50) return '#FFD3B6';
    if (passwordStrength < 75) return '#A8D8EA';
    return '#A8E6CF';
  };

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    clearError();

    try {
      const response = await authApi.register(
        values.name,
        values.email,
        values.password,
        values.confirmPassword
      );
      const { user, token } = response.data;
      
      login(user, token);
      message.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta';
      const errors = error.response?.data?.errors;
      
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
        message.error(errorMessages);
      } else {
        setError(errorMessage);
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-shape shape-1"></div>
        <div className="auth-shape shape-2"></div>
        <div className="auth-shape shape-3"></div>
      </div>
      
      <Card className="auth-card" bordered={false}>
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-text">Boardy</span>
          </div>
          <Title level={2} className="auth-title">
            Crie sua conta
          </Title>
          <Text className="auth-subtitle">
            Comece a organizar suas tarefas de forma elegante
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'Por favor, insira seu nome' },
              { min: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="input-icon" />}
              placeholder="Nome completo"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor, insira seu email' },
              { type: 'email', message: 'Email inválido' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="input-icon" />}
              placeholder="Email"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Por favor, insira sua senha' },
              { min: 8, message: 'Senha deve ter pelo menos 8 caracteres' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Senha deve conter: maiúscula, minúscula, número e símbolo'
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Senha"
              className="auth-input"
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div className="password-strength">
              <Progress
                percent={passwordStrength}
                showInfo={false}
                strokeColor={getStrengthColor()}
                trailColor="#F0F0F0"
                size="small"
              />
              <Text className="strength-text" style={{ color: getStrengthColor() }}>
                {getStrengthText()}
              </Text>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Por favor, confirme sua senha' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('As senhas não coincidem'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Confirmar senha"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="auth-button"
              block
            >
              Criar conta
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text className="divider-text">ou continue com</Text>
        </Divider>

        <div className="social-buttons">
          <Button className="social-button google" size="large">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          
          <Button className="social-button github" size="large">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
        </div>

        <div className="auth-footer">
          <Text>
            Já tem uma conta?{' '}
            <Link to="/login" className="auth-link">
              Faça login
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default RegisterPage;