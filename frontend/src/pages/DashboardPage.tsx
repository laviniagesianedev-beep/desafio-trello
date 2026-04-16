import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Modal,
  Form,
  Input,
  Typography,
  Space,
  Avatar,
  Dropdown,
  message,
  Spin,
  Empty,
  Tag,
  Skeleton,
} from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { boardApi, authApi } from '../services/api';
import './DashboardPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const PASTEL_COLORS = [
  '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2',
  '#FFD3B6', '#FFAAA5', '#A8E6CF', '#C7CEEA',
  '#7C6DD8', '#E8D5F5', '#D5E8D4', '#FFE0CC',
];

interface BoardData {
  id: number;
  title: string;
  description: string | null;
  background: string;
  lists_count?: number;
  cards_count?: number;
  members_count?: number;
  updated_at: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { boards, setBoards, setLoading, isLoading } = useBoardStore();
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [form] = Form.useForm();
  const [archivedBoards, setArchivedBoards] = useState<BoardData[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [restoringBoardId, setRestoringBoardId] = useState<number | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await boardApi.getAll();
      setBoards(response.data);
    } catch {
      setError('Não foi possível carregar seus quadros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedBoards = async () => {
    setLoadingArchived(true);
    try {
      const response = await boardApi.getArchived();
      setArchivedBoards(response.data);
    } catch {
      message.error('Erro ao carregar quadros arquivados');
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleToggleArchived = async () => {
    if (!showArchived && archivedBoards.length === 0) {
      await loadArchivedBoards();
    }
    setShowArchived(!showArchived);
  };

  const handleRestoreBoard = async (boardId: number) => {
    setRestoringBoardId(boardId);
    try {
      await boardApi.restore(boardId);
      message.success('Quadro restaurado');
      await loadArchivedBoards();
      loadBoards();
    } catch {
      message.error('Erro ao restaurar quadro');
    } finally {
      setRestoringBoardId(null);
    }
  };

  const handleCreateBoard = async (values: any) => {
    setIsCreating(true);
    try {
      const response = await boardApi.create({
        title: values.title,
        description: values.description,
        background: selectedColor,
      });
      message.success('Quadro criado com sucesso!');
      setCreateModalOpen(false);
      form.resetFields();
      navigate(`/board/${response.data.id}`);
    } catch {
      message.error('Erro ao criar quadro');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      message.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch {
      logout();
      navigate('/login');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', onClick: handleLogout },
  ];

  const renderBoardCard = (board: BoardData) => (
    <div
      key={board.id}
      className="board-card"
      onClick={() => navigate(`/board/${board.id}`)}
    >
      <div className="board-card-cover" style={{ '--board-bg': board.background } as React.CSSProperties}>
        <div className="board-card-gradient">
          <Title level={4} className="board-card-title">{board.title}</Title>
          {board.description && (
            <Text className="board-card-description" ellipsis>{board.description}</Text>
          )}
        </div>
      </div>
      <div className="board-card-footer">
        <Space size="small">
          <Tag className="board-card-tag"><FolderOutlined /> {board.lists_count || 0}</Tag>
          <Tag className="board-card-tag"><StarOutlined /> {board.cards_count || 0}</Tag>
          {(board.members_count ?? 0) > 1 && (
            <Tag className="board-card-tag"><TeamOutlined /> {board.members_count}</Tag>
          )}
        </Space>
        <Text className="board-card-date">
          <ClockCircleOutlined /> {formatDate(board.updated_at)}
        </Text>
      </div>
    </div>
  );

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/dashboard')}>
            <span className="logo-text">Boardy</span>
          </div>
        </div>

        <div className="header-right">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            className="create-button"
            loading={isCreating}
          >
            Criar Quadro
          </Button>

          <Button
            type="text"
            icon={<InboxOutlined />}
            onClick={handleToggleArchived}
            className={`archived-toggle ${showArchived ? 'active' : ''}`}
          >
            Arquivados
          </Button>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-avatar">
              <Avatar size={34} className="user-avatar-img">
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <span className="user-name">{user?.name}</span>
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content className="dashboard-content">
        <div className="dashboard-container">
          {isLoading ? (
            <div className="skeleton-container">
              <section className="boards-section">
                <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 20 }} />
                <div className="boards-grid">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="board-card skeleton-card">
                      <Skeleton.Input active style={{ width: '100%', height: 100 }} />
                      <div style={{ padding: '10px 12px' }}>
                        <Skeleton.Input active size="small" style={{ width: '70%', marginBottom: 8 }} />
                        <Skeleton.Input active size="small" style={{ width: '40%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : error ? (
            <div className="loading-container">
              <div className="board-error">
                <Text className="board-error-text">{error}</Text>
                <Button type="primary" onClick={loadBoards}>Tentar novamente</Button>
              </div>
            </div>
          ) : (
            <>
              {boards.owned.length > 0 && (
                <section className="boards-section">
                  <div className="section-header">
                    <Title level={3} className="section-title">
                      <FolderOutlined /> Meus Quadros
                    </Title>
                    <Text className="section-count">{boards.owned.length} quadros</Text>
                  </div>
                  <div className="boards-grid">
                    {boards.owned.map(renderBoardCard)}
                  </div>
                </section>
              )}

              {boards.member.length > 0 && (
                <section className="boards-section">
                  <div className="section-header">
                    <Title level={3} className="section-title">
                      <TeamOutlined /> Compartilhados Comigo
                    </Title>
                    <Text className="section-count">{boards.member.length} quadros</Text>
                  </div>
                  <div className="boards-grid">
                    {boards.member.map(renderBoardCard)}
                  </div>
                </section>
              )}

              {boards.owned.length === 0 && boards.member.length === 0 && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      <Title level={4}>Nenhum quadro encontrado</Title>
                      <Text>Crie seu primeiro quadro para começar a organizar suas tarefas</Text>
                    </span>
                  }
                  className="empty-state"
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                    size="large"
                  >
                    Criar Primeiro Quadro
                  </Button>
                </Empty>
              )}

              {showArchived && (
                <section className="boards-section archived-section">
                  <div className="section-header">
                    <Title level={3} className="section-title">
                      <InboxOutlined /> Quadros Arquivados
                    </Title>
                  </div>
                  {loadingArchived ? (
                    <Spin size="small" />
                  ) : archivedBoards.length === 0 ? (
                    <Text type="secondary">Nenhum quadro arquivado.</Text>
                  ) : (
                    <div className="boards-grid">
                      {archivedBoards.map(board => (
                        <div key={board.id} className="board-card archived-board-card">
                          <div className="board-card-cover" style={{ '--board-bg': board.background } as React.CSSProperties}>
                            <div className="board-card-gradient">
                              <Title level={4} className="board-card-title">{board.title}</Title>
                            </div>
                          </div>
                          <div className="board-card-footer">
                            <Button
                              type="link"
                              size="small"
                              icon={<FolderOutlined />}
                              loading={restoringBoardId === board.id}
                              onClick={() => handleRestoreBoard(board.id)}
                            >
                              Restaurar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </Content>

      <Modal
        title="Criar Novo Quadro"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        className="create-board-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateBoard}
          className="create-board-form"
        >
          <Form.Item
            name="title"
            label="Título do Quadro"
            rules={[
              { required: true, message: 'Por favor, insira o título do quadro' },
              { max: 255, message: 'Título muito longo' },
            ]}
          >
            <Input placeholder="Ex: Projeto Marketing" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Descrição (opcional)">
            <TextArea placeholder="Descreva o propósito deste quadro..." rows={3} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item label="Cor do Quadro">
            <div className="color-picker">
              {PASTEL_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ '--opt-color': color } as React.CSSProperties}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </Form.Item>

          <Form.Item>
            <div className="form-actions">
              <Button onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={isCreating}>Criar Quadro</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default DashboardPage;