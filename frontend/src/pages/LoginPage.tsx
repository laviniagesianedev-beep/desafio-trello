import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import './AuthPages.css';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, setError, clearError } = useAuthStore();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    clearError();

    try {
      const response = await authApi.login(values.email, values.password);
      const { user, token } = response.data;
      
      login(user, token);
      message.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      setError(errorMessage);
      message.error(errorMessage);
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
            Bem-vindo de volta!
          </Title>
          <Text className="auth-subtitle">
            Faça login para continuar organizando suas tarefas
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor, insira seu email' },
              { type: 'email', message: 'Email inválido' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="input-icon" />}
              placeholder="Email"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor, insira sua senha' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Senha"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item>
            <Link to="/forgot-password" className="forgot-password">
              Esqueceu sua senha?
            </Link>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="auth-button"
              block
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          <Text>
            Não tem uma conta?{' '}
            <Link to="/register" className="auth-link">
              Registre-se
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;