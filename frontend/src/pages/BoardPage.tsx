import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
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
  Tooltip,
  Form,
  Modal,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MoreOutlined,
  TeamOutlined,
  StarOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useBoardStore } from '../store/boardStore';
import { boardApi, listApi, cardApi } from '../services/api';
import { ListColumn, ListData } from '../components/ListColumn';
import { CardItem, CardData } from '../components/CardItem';
import { CardModal } from '../components/CardModal';
import { LabelBadge } from '../components/LabelBadge';
import './BoardPage.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface ListFormValues {
  title: string;
}

interface FilterState {
  search: string;
  labels: number[];
  dueDate: 'all' | 'overdue' | 'today' | 'week';
}

function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBoard, setCurrentBoard } = useBoardStore();

  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [listForm] = Form.useForm<ListFormValues>();
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [boardLabels, setBoardLabels] = useState<{ id: number; name: string; color: string }[]>([]);
  const [editingBoard, setEditingBoard] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardDesc, setEditBoardDesc] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    labels: [],
    dueDate: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (id) loadBoard();
  }, [id]);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const { data } = await boardApi.getById(Number(id));
      setCurrentBoard(data);
      setLists(data.lists || []);
      setBoardLabels(data.labels || []);
      setEditBoardTitle(data.title);
      setEditBoardDesc(data.description || '');
    } catch {
      message.error('Erro ao carregar quadro');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (values: ListFormValues) => {
    try {
      const { data } = await listApi.create(Number(id), values.title);
      setLists([...lists, { ...data, cards: [] }]);
      setIsAddingList(false);
      listForm.resetFields();
      message.success('Lista criada');
    } catch {
      message.error('Erro ao criar lista');
    }
  };

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card);
    setCardModalOpen(true);
  };

  const handleBack = () => navigate('/dashboard');

  const openAddList = () => {
    setIsAddingList(true);
  };

  const cancelAddList = () => {
    setIsAddingList(false);
    listForm.resetFields();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'card') return;

    const activeCard = activeData.card as CardData;
    const activeListId = lists.find(l => l.cards.some(c => c.id === activeCard.id))?.id;

    let overListId: number | undefined = undefined;
    if (overData?.type === 'list') {
      overListId = (overData.list as ListData).id;
    } else if (overData?.type === 'card') {
      overListId = lists.find(l => l.cards.some(c => c.id === (overData.card as CardData).id))?.id;
    }

    if (activeListId === undefined || overListId === undefined || activeListId === overListId) return;

    if (activeListId === null || overListId === null || activeListId === overListId) return;

    setLists(prev => {
      const activeList = prev.find(l => l.id === activeListId);
      const overList = prev.find(l => l.id === overListId);
      if (!activeList || !overList) return prev;

      const cardIndex = activeList.cards.findIndex(c => c.id === activeCard.id);
      const newActiveCards = [...activeList.cards];
      newActiveCards.splice(cardIndex, 1);

      let insertIndex = overList.cards.length;
      if (overData?.type === 'card') {
        const idx = overList.cards.findIndex(c => c.id === (overData.card as CardData).id);
        insertIndex = idx >= 0 ? idx : overList.cards.length;
      }

      const newOverCards = [...overList.cards];
      newOverCards.splice(insertIndex, 0, activeCard);

      return prev.map(list => {
        if (list.id === activeListId) return { ...list, cards: newActiveCards };
        if (list.id === overListId) return { ...list, cards: newOverCards };
        return list;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'card') {
      if (activeData?.type === 'list' && overData?.type === 'list') {
        const oldIndex = lists.findIndex(l => l.id === (activeData.list as ListData).id);
        const newIndex = lists.findIndex(l => l.id === (overData.list as ListData).id);
        if (oldIndex !== newIndex) {
          const newLists = arrayMove(lists, oldIndex, newIndex);
          setLists(newLists);
          try {
            await listApi.reorder((activeData.list as ListData).id, newIndex + 1);
          } catch {
            loadBoard();
          }
        }
      }
      return;
    }

    const activeCard = activeData.card as CardData;
    const activeListId = lists.find(l => l.cards.some(c => c.id === activeCard.id))?.id;

    if (overData?.type === 'card') {
      const overCard = overData.card as CardData;
      const overListId = lists.find(l => l.cards.some(c => c.id === overCard.id))?.id;

      if (activeListId === overListId && activeListId !== undefined) {
        const list = lists.find(l => l.id === activeListId);
        if (!list) return;
        const oldIndex = list.cards.findIndex(c => c.id === activeCard.id);
        const newIndex = list.cards.findIndex(c => c.id === overCard.id);
        if (oldIndex !== newIndex) {
          const newLists = lists.map(l => {
            if (l.id === activeListId) {
              return { ...l, cards: arrayMove(l.cards, oldIndex, newIndex) };
            }
            return l;
          });
          setLists(newLists);
          try {
            await cardApi.reorder(activeCard.id, newIndex + 1);
          } catch {
            loadBoard();
          }
        }
      } else if (activeListId !== undefined && overListId !== undefined) {
        const overList = lists.find(l => l.id === overListId);
        const newPosition = overList ? overList.cards.findIndex(c => c.id === overCard.id) + 1 : 1;
        try {
          await cardApi.move(activeCard.id, overListId, newPosition);
          loadBoard();
        } catch {
          message.error('Erro ao mover card');
          loadBoard();
        }
      }
    } else if (overData?.type === 'list') {
      const overListId = (overData.list as ListData).id;
      if (activeListId !== undefined && activeListId !== overListId) {
        const overList = lists.find(l => l.id === overListId);
        const newPosition = overList ? overList.cards.length + 1 : 1;
        try {
          await cardApi.move(activeCard.id, overListId, newPosition);
          loadBoard();
        } catch {
          message.error('Erro ao mover card');
          loadBoard();
        }
      }
    }
  };

  const hiddenCards = new Set<number>(
    lists.flatMap(l => l.cards)
      .filter(card => {
        if (filters.search && !card.title.toLowerCase().includes(filters.search.toLowerCase()) &&
            !(card.description || '').toLowerCase().includes(filters.search.toLowerCase())) {
          return true;
        }
        if (filters.labels.length > 0 && card.labels) {
          const cardLabelIds = card.labels.map(l => l.id);
          if (!filters.labels.some(id => cardLabelIds.includes(id))) {
            return true;
          }
        }
        if (filters.dueDate !== 'all' && card.due_date) {
          const due = new Date(card.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);

          if (filters.dueDate === 'overdue' && due >= today) return true;
          if (filters.dueDate === 'today' && due.toDateString() !== today.toDateString()) return true;
          if (filters.dueDate === 'week' && (due < today || due > weekEnd)) return true;
        } else if (filters.dueDate !== 'all' && !card.due_date) {
          return true;
        }
        return false;
      })
      .map(c => c.id)
  );

  const boardMenuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Editar quadro',
      onClick: () => setEditingBoard(true),
    },
    {
      key: 'members',
      icon: <TeamOutlined />,
      label: 'Membros',
    },
    { type: 'divider' as const },
    {
      key: 'star',
      icon: <StarOutlined />,
      label: 'Favoritar',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'archive',
      icon: <EditOutlined />,
      label: 'Arquivar',
      danger: true,
    },
  ];

  const handleSaveBoard = async () => {
    if (!currentBoard) return;
    try {
      await boardApi.update(currentBoard.id, {
        title: editBoardTitle,
        description: editBoardDesc,
      });
      setEditingBoard(false);
      loadBoard();
      message.success('Quadro atualizado');
    } catch {
      message.error('Erro ao atualizar quadro');
    }
  };

  const handleDeleteBoard = async () => {
    if (!currentBoard) return;
    try {
      await boardApi.delete(currentBoard.id);
      message.success('Quadro excluído');
      navigate('/dashboard');
    } catch {
      message.error('Erro ao excluir quadro');
    }
  };

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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} className="back-button" />
          <div className="board-info">
            <Title level={4} className="board-title">{currentBoard?.title}</Title>
            {currentBoard?.description && (
              <Text className="board-description" ellipsis>{currentBoard.description}</Text>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="board-filters">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Buscar cards..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ width: 160 }}
              size="small"
              allowClear
            />
            <Button
              type="text"
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'active' : ''}
              size="small"
            />
          </div>

          {showFilters && (
            <div className="filter-panel">
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>Labels:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {boardLabels.map(label => (
                  <LabelBadge
                    key={label.id}
                    name={label.name}
                    color={label.color}
                    onClick={() => {
                      setFilters(f => ({
                        ...f,
                        labels: f.labels.includes(label.id)
                          ? f.labels.filter(id => id !== label.id)
                          : [...f.labels, label.id],
                      }));
                    }}
                  />
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: '0.8rem', marginTop: 8, display: 'block' }}>Data:</Text>
              <Space size={4}>
                {(['all', 'overdue', 'today', 'week'] as const).map(opt => (
                  <Button
                    key={opt}
                    size="small"
                    type={filters.dueDate === opt ? 'primary' : 'default'}
                    onClick={() => setFilters(f => ({ ...f, dueDate: opt }))}
                  >
                    {opt === 'all' ? 'Todas' : opt === 'overdue' ? 'Atrasadas' : opt === 'today' ? 'Hoje' : 'Semana'}
                  </Button>
                ))}
              </Space>
            </div>
          )}

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
            <Button type="text" icon={<TeamOutlined />} className="members-button">
              Membros
            </Button>
          </div>

          <Dropdown menu={{ items: boardMenuItems }} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} className="more-button" />
          </Dropdown>
        </div>
      </Header>

      <Content className="board-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board-container">
            <div className="lists-container">
              <SortableContext items={lists.map(l => `list-${l.id}`)} strategy={horizontalListSortingStrategy}>
                {lists.map(list => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    onCardClick={handleCardClick}
                    onListUpdated={loadBoard}
                    onListDeleted={loadBoard}
                    onCardCreated={loadBoard}
                    hiddenCards={hiddenCards}
                  />
                ))}
              </SortableContext>

              {isAddingList ? (
                <div className="add-list-form">
                  <Form form={listForm} layout="vertical" onFinish={handleCreateList}>
                    <Form.Item name="title" rules={[{ required: true, message: 'Título é obrigatório' }]}>
                      <Input placeholder="Título da lista" autoFocus />
                    </Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" size="small">Adicionar</Button>
                      <Button size="small" onClick={cancelAddList}>Cancelar</Button>
                    </Space>
                  </Form>
                </div>
              ) : (
                <Button type="dashed" icon={<PlusOutlined />} className="add-list-button" onClick={openAddList}>
                  Adicionar lista
                </Button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && (
              <div style={{ opacity: 0.8 }}>
                <CardItem card={activeCard} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </Content>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={Number(id)}
          open={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          onUpdated={loadBoard}
          onDeleted={loadBoard}
        />
      )}

      <Modal
        open={editingBoard}
        onCancel={() => setEditingBoard(false)}
        title="Editar Quadro"
        onOk={handleSaveBoard}
        okText="Salvar"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">Título</Text>
            <Input value={editBoardTitle} onChange={e => setEditBoardTitle(e.target.value)} />
          </div>
          <div>
            <Text type="secondary">Descrição</Text>
            <Input.TextArea value={editBoardDesc} onChange={e => setEditBoardDesc(e.target.value)} rows={2} />
          </div>
          <Popconfirm
            title="Excluir este quadro?"
            description="Todos os dados serão perdidos."
            onConfirm={handleDeleteBoard}
            okText="Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Excluir Quadro</Button>
          </Popconfirm>
        </Space>
      </Modal>
    </Layout>
  );
}

export default BoardPage;
