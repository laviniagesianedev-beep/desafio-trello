import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Typography, Button, Input, Form, Dropdown, Popconfirm, Select, message } from 'antd';
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { CardItem, CardData } from './CardItem';
import { listApi } from '../services/api';
import './ListColumn.css';

const { Title } = Typography;

export interface ListData {
  id: number;
  title: string;
  position: number;
  cards: CardData[];
}

interface ListColumnProps {
  list: ListData;
  allLists: ListData[];
  onCardClick: (card: CardData) => void;
  onCreateCard: (listId: number) => void;
  onListUpdated: () => void;
  onListDeleted: () => void;
  hiddenCards?: Set<number>;
}

export function ListColumn({ list, allLists, onCardClick, onCreateCard, onListUpdated, onListDeleted, hiddenCards = new Set() }: ListColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(list.title);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moveToListId, setMoveToListId] = useState<number | undefined>(undefined);

  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', list },
  });

  const handleRename = async () => {
    try {
      await listApi.update(list.id, editingTitle);
      setIsEditing(false);
      onListUpdated();
    } catch {
      message.error('Erro ao renomear lista');
    }
  };

  const handleDelete = async () => {
    try {
      await listApi.delete(list.id, moveToListId);
      message.success(moveToListId ? 'Lista excluída e cards movidos' : 'Lista excluída');
      setDeleteModalOpen(false);
      setMoveToListId(undefined);
      onListDeleted();
    } catch {
      message.error('Erro ao excluir lista');
    }
  };

  const otherLists = allLists.filter(l => l.id !== list.id);

  const menuItems = [
    { key: 'rename', icon: <EditOutlined />, label: 'Renomear', onClick: () => setIsEditing(true) },
    { type: 'divider' as const },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Excluir', danger: true, onClick: () => setDeleteModalOpen(true) },
  ];

  const deleteContent = list.cards.length > 0 ? (
    <div className="delete-list-content">
      <p>Esta lista tem <strong>{list.cards.length} card{list.cards.length > 1 ? 's' : ''}</strong>.</p>
      {otherLists.length > 0 && (
        <div className="delete-list-move">
          <label>Mover cards para:</label>
          <Select
            placeholder="Selecionar lista..."
            className="delete-list-select"
            allowClear
            onChange={(value) => setMoveToListId(value)}
            options={otherLists.map(l => ({ value: l.id, label: l.title }))}
          />
        </div>
      )}
      <p className="delete-list-warning">
        {moveToListId ? 'Cards serão movidos antes de excluir.' : 'Os cards serão excluídos junto com a lista.'}
      </p>
    </div>
  ) : (
    <p>Esta lista está vazia. Confirmar exclusão?</p>
  );

  return (
    <div className={`list-column ${isOver ? 'drag-over' : ''}`} ref={setNodeRef}>
      <div className="list-header">
        {isEditing ? (
          <Form layout="inline" className="list-title-form">
            <Input
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onPressEnter={handleRename}
              onBlur={handleRename}
              autoFocus
              size="small"
            />
          </Form>
        ) : (
          <Title level={5} className="list-title">{list.title}</Title>
        )}
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} className="list-menu-button" />
        </Dropdown>
      </div>

      <div className="list-cards">
        <SortableContext items={list.cards.map(c => `card-${c.id}`)} strategy={verticalListSortingStrategy}>
          {list.cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              isHidden={hiddenCards.has(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      <Button
        type="text"
        icon={<PlusOutlined />}
        className="add-card-button"
        onClick={() => onCreateCard(list.id)}
      >
        Adicionar card
      </Button>

      <Popconfirm
        open={deleteModalOpen}
        onOpenChange={(open) => { if (!open) { setDeleteModalOpen(false); setMoveToListId(undefined); } }}
        title="Excluir lista?"
        description={deleteContent}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteModalOpen(false); setMoveToListId(undefined); }}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      />
    </div>
  );
}