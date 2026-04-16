import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Input, Button, Typography, message, Form } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authApi } from '../services/api';
import './AuthPages.css';

const { Title, Text } = Typography;

const PASSWORD_RULES = [
  { required: true, message: 'Por favor, insira sua senha' },
  { min: 8, message: 'Senha deve ter pelo menos 8 caracteres' },
  { 
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Senha deve conter: maiúscula, minúscula, número e símbolo'
  },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
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

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword(email, values.password, values.confirmPassword, token);
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
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          <Form.Item name="password" rules={PASSWORD_RULES}>
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              placeholder="Nova senha"
              className="auth-input"
            />
          </Form.Item>
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
              placeholder="Confirmar nova senha"
              className="auth-input"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className="auth-button"
          >
            Redefinir senha
          </Button>
        </Form>
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
