import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Progress } from 'antd';
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
    if (passwordStrength < 75) return '#AA96DA';
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