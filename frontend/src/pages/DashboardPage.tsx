import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Tabs, 
  Card, 
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
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  TeamOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  MoreOutlined,
  FolderOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { boardApi } from '../services/api';
import './DashboardPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Cores pastéis para quadros
const PASTEL_COLORS = [
  '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2', 
  '#FFD3B6', '#FFAAA5', '#A8E6CF', '#C7CEEA'
];

interface BoardData {
  id: number;
  title: string;
  description: string | null;
  background: string;
  lists_count: number;
  cards_count: number;
  members_count: number;
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [form] = Form.useForm();

  // Carregar quadros
  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const response = await boardApi.getAll();
      setBoards(response.data);
    } catch (error) {
      message.error('Erro ao carregar quadros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (values: any) => {
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
    } catch (error) {
      message.error('Erro ao criar quadro');
    }
  };

  const handleLogout = async () => {
    try {
      await boardApi.getAll(); // Garantir que a API está acessível
      logout();
      message.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
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
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
    },
  ];

  const renderBoardCard = (board: BoardData) => (
    <Card
      key={board.id}
      className="board-card"
      hoverable
      onClick={() => navigate(`/board/${board.id}`)}
      style={{ backgroundColor: board.background }}
      cover={
        <div className="board-card-cover" style={{ backgroundColor: board.background }}>
          <div className="board-card-overlay">
            <Title level={4} className="board-card-title">
              {board.title}
            </Title>
            {board.description && (
              <Text className="board-card-description" ellipsis>
                {board.description}
              </Text>
            )}
          </div>
        </div>
      }
    >
      <div className="board-card-meta">
        <Space size="small">
          <Tag icon={<FolderOutlined />}>{board.lists_count || 0} listas</Tag>
          <Tag icon={<StarOutlined />}>{board.cards_count || 0} cards</Tag>
          {board.members_count > 1 && (
            <Tag icon={<TeamOutlined />}>{board.members_count} membros</Tag>
          )}
        </Space>
        <Text className="board-card-date">
          <ClockCircleOutlined /> {formatDate(board.updated_at)}
        </Text>
      </div>
    </Card>
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
          >
            Criar Quadro
          </Button>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-avatar">
              <Avatar size={36} style={{ backgroundColor: '#A8D8EA' }}>
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
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Quadros próprios */}
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

              {/* Quadros compartilhados */}
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

              {/* Estado vazio */}
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
            </>
          )}
        </div>
      </Content>

      {/* Modal de Criar Quadro */}
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

          <Form.Item
            name="description"
            label="Descrição (opcional)"
          >
            <TextArea 
              placeholder="Descreva o propósito deste quadro..."
              rows={3}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item label="Cor do Quadro">
            <div className="color-picker">
              {PASTEL_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Criar Quadro
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default DashboardPage;