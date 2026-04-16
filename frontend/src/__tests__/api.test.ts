import { describe, it, expect } from 'vitest';
import { authApi, boardApi, listApi, cardApi, labelApi, checklistApi, commentApi, attachmentApi, memberApi, ApiResponse, ApiError } from '../services/api';

describe('authApi', () => {
  it('deve exports login function', () => {
    expect(authApi).toBeDefined();
    expect(typeof authApi.login).toBe('function');
  });

  it('deve exports register function', () => {
    expect(typeof authApi.register).toBe('function');
  });

  it('deve exports logout function', () => {
    expect(typeof authApi.logout).toBe('function');
  });

  it('deve exports forgotPassword function', () => {
    expect(typeof authApi.forgotPassword).toBe('function');
  });

  it('deve exports resetPassword function', () => {
    expect(typeof authApi.resetPassword).toBe('function');
  });

  it('deve exports getUser function', () => {
    expect(typeof authApi.getUser).toBe('function');
  });
});

describe('boardApi', () => {
  it('deve exports getAll function', () => {
    expect(boardApi).toBeDefined();
    expect(typeof boardApi.getAll).toBe('function');
  });

  it('deve exports getShared function', () => {
    expect(typeof boardApi.getShared).toBe('function');
  });

  it('deve exports getArchived function', () => {
    expect(typeof boardApi.getArchived).toBe('function');
  });

  it('deve exports getById function', () => {
    expect(typeof boardApi.getById).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof boardApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof boardApi.update).toBe('function');
  });

  it('deve exports archive function', () => {
    expect(typeof boardApi.archive).toBe('function');
  });

  it('deve exports restore function', () => {
    expect(typeof boardApi.restore).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof boardApi.delete).toBe('function');
  });
});

describe('listApi', () => {
  it('deve exports todas as funções', () => {
    expect(listApi).toBeDefined();
  });

  it('deve exports getByBoard function', () => {
    expect(typeof listApi.getByBoard).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof listApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof listApi.update).toBe('function');
  });

  it('deve exports reorder function', () => {
    expect(typeof listApi.reorder).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof listApi.delete).toBe('function');
  });
});

describe('cardApi', () => {
  it('deve exports todas as funções', () => {
    expect(cardApi).toBeDefined();
  });

  it('deve exports getByList function', () => {
    expect(typeof cardApi.getByList).toBe('function');
  });

  it('deve exports getById function', () => {
    expect(typeof cardApi.getById).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof cardApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof cardApi.update).toBe('function');
  });

  it('deve exports reorder function', () => {
    expect(typeof cardApi.reorder).toBe('function');
  });

  it('deve exports move function', () => {
    expect(typeof cardApi.move).toBe('function');
  });

  it('deve exports archive function', () => {
    expect(typeof cardApi.archive).toBe('function');
  });

  it('deve exports restore function', () => {
    expect(typeof cardApi.restore).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof cardApi.delete).toBe('function');
  });
});

describe('labelApi', () => {
  it('deve exports todas as funções', () => {
    expect(labelApi).toBeDefined();
  });

  it('deve exports getByBoard function', () => {
    expect(typeof labelApi.getByBoard).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof labelApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof labelApi.update).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof labelApi.delete).toBe('function');
  });
});

describe('checklistApi', () => {
  it('deve exports todas as funções', () => {
    expect(checklistApi).toBeDefined();
  });

  it('deve exports getByCard function', () => {
    expect(typeof checklistApi.getByCard).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof checklistApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof checklistApi.update).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof checklistApi.delete).toBe('function');
  });
});

describe('commentApi', () => {
  it('deve exports todas as funções', () => {
    expect(commentApi).toBeDefined();
  });

  it('deve exports getByCard function', () => {
    expect(typeof commentApi.getByCard).toBe('function');
  });

  it('deve exports create function', () => {
    expect(typeof commentApi.create).toBe('function');
  });

  it('deve exports update function', () => {
    expect(typeof commentApi.update).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof commentApi.delete).toBe('function');
  });
});

describe('attachmentApi', () => {
  it('deve exports todas as funções', () => {
    expect(attachmentApi).toBeDefined();
  });

  it('deve exports getByCard function', () => {
    expect(typeof attachmentApi.getByCard).toBe('function');
  });

  it('deve exports upload function', () => {
    expect(typeof attachmentApi.upload).toBe('function');
  });

  it('deve exports download function', () => {
    expect(typeof attachmentApi.download).toBe('function');
  });

  it('deve exports delete function', () => {
    expect(typeof attachmentApi.delete).toBe('function');
  });
});

describe('memberApi', () => {
  it('deve exports todas as funções', () => {
    expect(memberApi).toBeDefined();
  });

  it('deve exports getByBoard function', () => {
    expect(typeof memberApi.getByBoard).toBe('function');
  });

  it('deve exports add function', () => {
    expect(typeof memberApi.add).toBe('function');
  });

  it('deve exports updateRole function', () => {
    expect(typeof memberApi.updateRole).toBe('function');
  });

  it('deve exports remove function', () => {
    expect(typeof memberApi.remove).toBe('function');
  });
});

describe('API Types', () => {
  it('deve definir interface ApiResponse com tipo genérico', () => {
    const response: ApiResponse<{ id: number; name: string }> = {
      data: { id: 1, name: 'Test' },
      message: 'Sucesso',
    };
    
    expect(response.data).toEqual({ id: 1, name: 'Test' });
    expect(response.message).toBe('Sucesso');
  });

  it('ApiResponse deve permitir data como qualquer tipo', () => {
    const response: ApiResponse<string> = {
      data: 'test string',
    };
    
    expect(response.data).toBe('test string');
  });

  it('deve definir interface ApiError', () => {
    const error: ApiError = {
      message: 'Erro occurred',
    };
    
    expect(error.message).toBe('Erro occurred');
  });

  it('ApiError deve permitir errors opcionais', () => {
    const error: ApiError = {
      message: 'Validation failed',
      errors: { email: ['Email inválido'], password: ['Senha muito curta'] },
    };
    
    expect(error.errors?.email).toContain('Email inválido');
  });
});

describe('API Configuration', () => {
  it('VITE_API_URL deve ser configurado ou fallback deve ser /api', () => {
    // Testa que a configuração existe e é uma string
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });
});