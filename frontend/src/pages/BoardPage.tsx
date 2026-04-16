import { useState, useEffect, useCallback } from 'react';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Layout,
  Button,
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

const PASTEL_COLORS = [
  '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2',
  '#FFD3B6', '#FFAAA5', '#A8E6CF', '#C7CEEA',
];

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
  const [editBoardColor, setEditBoardColor] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    labels: [],
    dueDate: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadBoard = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await boardApi.getById(Number(id));
      setCurrentBoard(data);
      setLists(data.lists || []);
      setBoardLabels(data.labels || []);
      setEditBoardTitle(data.title);
      setEditBoardDesc(data.description || '');
      setEditBoardColor(data.background || '');
    } catch {
      message.error('Erro ao carregar quadro');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleCreateList = async (values: ListFormValues) => {
    try {
      const { data } = await listApi.create(Number(id), values.title);
      setLists(prev => [...prev, { ...data, cards: [] }]);
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card as CardData);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'list' && overData?.type === 'list') {
      const oldIndex = lists.findIndex(l => l.id === (activeData.list as ListData).id);
      const newIndex = lists.findIndex(l => l.id === (overData.list as ListData).id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex);
        setLists(newLists);
        try {
          await listApi.reorder((activeData.list as ListData).id, newIndex + 1);
        } catch {
          loadBoard();
        }
      }
      return;
    }

    if (activeData?.type !== 'card') return;

    const activeCardData = activeData.card as CardData;
    const sourceListId = lists.find(l => l.cards.some(c => c.id === activeCardData.id))?.id;

    if (!sourceListId) return;

    let targetListId: number | undefined;
    let targetIndexInList: number | undefined;

    if (overData?.type === 'card') {
      const overCardData = overData.card as CardData;
      targetListId = lists.find(l => l.cards.some(c => c.id === overCardData.id))?.id;
      if (targetListId !== undefined) {
        const targetList = lists.find(l => l.id === targetListId)!;
        targetIndexInList = targetList.cards.findIndex(c => c.id === overCardData.id);
      }
    } else if (overData?.type === 'list') {
      targetListId = (overData.list as ListData).id;
      const targetList = lists.find(l => l.id === targetListId);
      targetIndexInList = targetList ? targetList.cards.length : 0;
    }

    if (targetListId === undefined) return;

    if (sourceListId === targetListId) {
      if (targetIndexInList === undefined) return;
      const list = lists.find(l => l.id === sourceListId);
      if (!list) return;
      const oldIdx = list.cards.findIndex(c => c.id === activeCardData.id);
      if (oldIdx === -1 || oldIdx === targetIndexInList) return;

      const newCards = arrayMove(list.cards, oldIdx, targetIndexInList);
      setLists(prev => prev.map(l => l.id === sourceListId ? { ...l, cards: newCards } : l));
      try {
        await cardApi.reorder(activeCardData.id, targetIndexInList + 1);
      } catch {
        loadBoard();
      }
    } else {
      const sourceList = lists.find(l => l.id === sourceListId);
      const targetList = lists.find(l => l.id === targetListId);
      if (!sourceList || !targetList) return;

      const newPosition = targetIndexInList !== undefined
        ? targetIndexInList + 1
        : targetList.cards.length + 1;

      setLists(prev => {
        const cardIdx = sourceList.cards.findIndex(c => c.id === activeCardData.id);
        const cardToMove = sourceList.cards[cardIdx];
        const newSourceCards = sourceList.cards.filter(c => c.id !== activeCardData.id);
        const newTargetCards = [...targetList.cards];
        const insertAt = targetIndexInList !== undefined ? targetIndexInList : newTargetCards.length;
        newTargetCards.splice(insertAt, 0, cardToMove);
        return prev.map(l => {
          if (l.id === sourceListId) return { ...l, cards: newSourceCards };
          if (l.id === targetListId) return { ...l, cards: newTargetCards };
          return l;
        });
      });

      try {
        await cardApi.move(activeCardData.id, targetListId, newPosition);
      } catch {
        message.error('Erro ao mover card');
        loadBoard();
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
        background: editBoardColor,
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
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} className="back-button" />
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
              className="filter-search"
              size="small"
              allowClear
            />
            <Button
              type="text"
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              size="small"
            />
          </div>

          {showFilters && (
            <div className="filter-panel">
              <Text type="secondary" className="filter-label">Labels:</Text>
              <div className="filter-labels-list">
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
              <Text type="secondary" className="filter-label filter-label-date">Data:</Text>
              <div className="filter-date-buttons">
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
              </div>
            </div>
          )}

          <div className="board-members">
            <Avatar.Group maxCount={3} size={32}>
              {currentBoard?.members?.map((member: any) => (
                <Tooltip key={member.id} title={member.name}>
                  <Avatar className="member-avatar">
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
          onDragEnd={handleDragEnd}
        >
          <div className="board-container">
            <div className="lists-container">
              <SortableContext items={lists.map(l => `list-${l.id}`)} strategy={horizontalListSortingStrategy}>
                {lists.map(list => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    allLists={lists}
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
                    <div className="add-list-actions">
                      <Button type="primary" htmlType="submit" size="small">Adicionar</Button>
                      <Button size="small" onClick={() => { setIsAddingList(false); listForm.resetFields(); }}>Cancelar</Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <Button type="dashed" icon={<PlusOutlined />} className="add-list-button" onClick={() => setIsAddingList(true)}>
                  Adicionar lista
                </Button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="drag-overlay-card">
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
        className="edit-board-modal"
      >
        <div className="edit-board-form">
          <div className="edit-board-field">
            <Text type="secondary">Título</Text>
            <Input value={editBoardTitle} onChange={e => setEditBoardTitle(e.target.value)} />
          </div>
          <div className="edit-board-field">
            <Text type="secondary">Descrição</Text>
            <Input.TextArea value={editBoardDesc} onChange={e => setEditBoardDesc(e.target.value)} rows={2} />
          </div>
          <div className="edit-board-field">
            <Text type="secondary">Cor</Text>
            <div className="color-picker">
              {PASTEL_COLORS.map(color => (
                <div
                  key={color}
                  className={`color-option ${editBoardColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditBoardColor(color)}
                />
              ))}
            </div>
          </div>
          <Popconfirm
            title="Excluir este quadro?"
            description="Todos os dados serão perdidos."
            onConfirm={handleDeleteBoard}
            okText="Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger className="delete-board-button">Excluir Quadro</Button>
          </Popconfirm>
        </div>
      </Modal>
    </Layout>
  );
}

export default BoardPage;