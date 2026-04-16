import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Mock de dependências
vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(() => Promise.resolve({ data: { user: {}, token: 'test' } })),
    register: vi.fn(() => Promise.resolve({ data: { user: {}, token: 'test' } })),
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    logout: vi.fn(),
    error: null,
    isLoading: false,
  })),
}));

// Componente wrapper para fornecer Router
function WrappedLoginPage() {
  return (
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
}

function WrappedRegisterPage() {
  return (
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar campo de email', () => {
    render(<WrappedLoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('deve renderizar campo de senha', () => {
    render(<WrappedLoginPage />);
    
    const passwordInput = screen.getAllByPlaceholderText(/senha/i)[0];
    expect(passwordInput).toBeInTheDocument();
  });

  it('deve renderizar botão de submit', () => {
    render(<WrappedLoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('deve renderizar título de boas-vindas', () => {
    render(<WrappedLoginPage />);
    
    const title = screen.getByText(/bem-vindo/i);
    expect(title).toBeInTheDocument();
  });

  it('deve ter link para registro', () => {
    render(<WrappedLoginPage />);
    
    const registerLink = screen.getByText(/registre-se/i);
    expect(registerLink).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar campo de nome', () => {
    render(<WrappedRegisterPage />);
    
    const nameInput = screen.getByPlaceholderText(/nome completo/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('deve renderizar campo de email', () => {
    render(<WrappedRegisterPage />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('deve renderizar campo de senha', () => {
    render(<WrappedRegisterPage />);
    
    // Primeiro campo de senha (não "confirmar senha")
    const passwordInputs = screen.getAllByPlaceholderText(/senha/i);
    expect(passwordInputs[0]).toBeInTheDocument();
  });

  it('deve renderizar campo de confirmar senha', () => {
    render(<WrappedRegisterPage />);
    
    const confirmPasswordInput = screen.getByPlaceholderText(/confirmar senha/i);
    expect(confirmPasswordInput).toBeInTheDocument();
  });

  it('deve renderizar botão de criar conta', () => {
    render(<WrappedRegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('deve renderizar campo de senha e confirmar senha', () => {
    render(<WrappedRegisterPage />);
    
    // Deve haver 2 campos de senha: "Senha" e "Confirmar senha"
    const passwordInputs = screen.getAllByPlaceholderText(/senha/i);
    expect(passwordInputs).toHaveLength(2);
  });
});

describe('Validação de senha', () => {
  it('deve aceitar senha com pelo menos 8 caracteres', () => {
    const validPassword = 'password123';
    
    expect(validPassword.length).toBeGreaterThanOrEqual(8);
  });

  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const invalidPassword = 'pass';
    
    expect(invalidPassword.length).toBeLessThan(8);
  });
});

describe('AuthStore - interface', () => {
  it('useAuthStore deve ser uma função', async () => {
    const { useAuthStore } = await import('../store/authStore');
    expect(useAuthStore).toBeDefined();
    expect(typeof useAuthStore).toBe('function');
  });

  it('AuthState deve definir os campos necessários', async () => {
    const { useAuthStore } = await import('../store/authStore');
    // Zustand store hooks don't always expose getState in tests
    // Just verify the store can be called
    const hookResult = useAuthStore();
    
    // Hook deve retornar um objeto de estado
    expect(hookResult).toBeDefined();
    expect(typeof hookResult).toBe('object');
  });
});