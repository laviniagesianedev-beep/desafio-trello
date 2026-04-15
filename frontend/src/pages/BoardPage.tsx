import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Space,
  Typography,
  Avatar,
  Dropdown,
  Input,
  Spin,
  message,
  Modal,
  Tooltip,
  Form,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MoreOutlined,
  TeamOutlined,
  SettingOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { boardApi, listApi, cardApi } from '../services/api';
import './BoardPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface List {
  id: number;
  title: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: number;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  comments_count?: number;
  attachments_count?: number;
  assigned_members?: any[];
}

interface CardFormValues {
  title: string;
  description?: string;
  due_date?: Dayjs;
}

interface ListFormValues {
  title: string;
}

function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentBoard, setCurrentBoard } = useBoardStore();

  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [listForm] = Form.useForm<ListFormValues>();
  const [cardForm] = Form.useForm<CardFormValues>();

  useEffect(() => {
    if (id) {
      loadBoard();
    }
  }, [id]);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const response = await boardApi.getById(Number(id));
      setCurrentBoard(response.data);
      setLists(response.data.lists || []);
    } catch (error) {
      message.error('Erro ao carregar quadro');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (values: ListFormValues) => {
    try {
      const response = await listApi.create(Number(id), values.title);
      setLists([...lists, { ...response.data, cards: [] }]);
      setIsAddingList(false);
      listForm.resetFields();
      message.success('Lista criada com sucesso!');
    } catch (error) {
      message.error('Erro ao criar lista');
    }
  };

  const handleCreateCard = async (listId: number, values: CardFormValues) => {
    try {
      const payload: { title: string; description?: string; due_date?: string } = {
        title: values.title,
      };
      if (values.description) {
        payload.description = values.description;
      }
      if (values.due_date) {
        payload.due_date = values.due_date.format('YYYY-MM-DD');
      }

      const response = await cardApi.create(listId, payload);
      setLists(lists.map(list =>
        list.id === listId
          ? { ...list, cards: [...list.cards, response.data] }
          : list
      ));
      setAddingCardToList(null);
      cardForm.resetFields();
      message.success('Card criado com sucesso!');
    } catch (error) {
      message.error('Erro ao criar card');
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setCardModalOpen(true);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const openAddCard = (listId: number) => {
    setAddingCardToList(listId);
    setIsAddingList(false);
  };

  const openAddList = () => {
    setIsAddingList(true);
    setAddingCardToList(null);
  };

  const cancelAddCard = () => {
    setAddingCardToList(null);
    cardForm.resetFields();
  };

  const cancelAddList = () => {
    setIsAddingList(false);
    listForm.resetFields();
  };

  const boardMenuItems = [
    {
      key: 'members',
      icon: <TeamOutlined />,
      label: 'Membros',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'star',
      icon: <StarOutlined />,
      label: 'Favoritar',
    },
    {
      key: 'archive',
      icon: <EditOutlined />,
      label: 'Arquivar',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Excluir',
      danger: true,
    },
  ];

  if (loading) {
    return (
      <div className="board-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="board-layout">
      <Header className="board-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="back-button"
          />
          <div className="board-info">
            <Title level={4} className="board-title">
              {currentBoard?.title}
            </Title>
            {currentBoard?.description && (
              <Text className="board-description" ellipsis>
                {currentBoard.description}
              </Text>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="board-members">
            <Avatar.Group maxCount={3} size={32}>
              {currentBoard?.members?.map((member: any) => (
                <Tooltip key={member.id} title={member.name}>
                  <Avatar style={{ backgroundColor: '#A8D8EA' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            <Button
              type="text"
              icon={<TeamOutlined />}
              className="members-button"
            >
              Membros
            </Button>
          </div>

          <Dropdown menu={{ items: boardMenuItems }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} className="more-button" />
          </Dropdown>
        </div>
      </Header>

      <Content className="board-content">
        <div className="board-container">
          <div className="lists-container">
            {lists.map((list) => (
              <div key={list.id} className="list-column">
                <div className="list-header">
                  <Title level={5} className="list-title">
                    {list.title}
                  </Title>
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="list-menu-button"
                  />
                </div>

                <div className="list-cards">
                  {list.cards.map((card) => (
                    <div
                      key={card.id}
                      className="card-item"
                      onClick={() => handleCardClick(card)}
                    >
                      <Text className="card-title">{card.title}</Text>
                      {card.description && (
                        <Text className="card-description" ellipsis>
                          {card.description}
                        </Text>
                      )}
                      <div className="card-meta">
                        {card.due_date && (
                          <span className="card-due">
                            {new Date(card.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {(card.comments_count || 0) > 0 && (
                          <span className="card-comments">
                            💬 {card.comments_count}
                          </span>
                        )}
                        {(card.attachments_count || 0) > 0 && (
                          <span className="card-attachments">
                            📎 {card.attachments_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {addingCardToList === list.id ? (
                  <div className="add-card-form">
                    <Form
                      form={cardForm}
                      layout="vertical"
                      onFinish={(values) => handleCreateCard(list.id, values)}
                    >
                      <Form.Item
                        name="title"
                        rules={[{ required: true, message: 'Título é obrigatório' }]}
                      >
                        <Input placeholder="Título do card" autoFocus />
                      </Form.Item>
                      <Form.Item name="description">
                        <TextArea
                          placeholder="Descrição (opcional)"
                          rows={2}
                        />
                      </Form.Item>
                      <Form.Item name="due_date">
                        <DatePicker
                          placeholder="Data de entrega (opcional)"
                          style={{ width: '100%' }}
                          format="DD/MM/YYYY"
                        />
                      </Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" size="small">
                          Adicionar
                        </Button>
                        <Button size="small" onClick={cancelAddCard}>
                          Cancelar
                        </Button>
                      </Space>
                    </Form>
                  </div>
                ) : (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    className="add-card-button"
                    onClick={() => openAddCard(list.id)}
                  >
                    Adicionar card
                  </Button>
                )}
              </div>
            ))}

            {isAddingList ? (
              <div className="add-list-form">
                <Form
                  form={listForm}
                  layout="vertical"
                  onFinish={handleCreateList}
                >
                  <Form.Item
                    name="title"
                    rules={[{ required: true, message: 'Título é obrigatório' }]}
                  >
                    <Input placeholder="Título da lista" autoFocus />
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" size="small">
                      Adicionar
                    </Button>
                    <Button size="small" onClick={cancelAddList}>
                      Cancelar
                    </Button>
                  </Space>
                </Form>
              </div>
            ) : (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                className="add-list-button"
                onClick={openAddList}
              >
                Adicionar lista
              </Button>
            )}
          </div>
        </div>
      </Content>

      <Modal
        title={selectedCard?.title}
        open={cardModalOpen}
        onCancel={() => setCardModalOpen(false)}
        footer={null}
        width={720}
        className="card-modal"
      >
        {selectedCard && (
          <div className="card-detail">
            <div className="card-detail-section">
              <Title level={5}>Descrição</Title>
              <Text>{selectedCard.description || 'Sem descrição'}</Text>
            </div>

            {selectedCard.due_date && (
              <div className="card-detail-section">
                <Title level={5}>Data de entrega</Title>
                <Text>
                  {new Date(selectedCard.due_date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </div>
            )}

            <div className="card-detail-section">
              <Title level={5}>Comentários</Title>
              <Text>Seção de comentários (implementar)</Text>
            </div>

            <div className="card-detail-section">
              <Title level={5}>Anexos</Title>
              <Text>Seção de anexos (implementar)</Text>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default BoardPage;
