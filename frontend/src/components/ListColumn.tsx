import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Typography, Button, Input, Form, Dropdown, message, Space } from 'antd';
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { CardItem, CardData } from './CardItem';
import { listApi, cardApi } from '../services/api';

const { Title } = Typography;

export interface ListData {
  id: number;
  title: string;
  position: number;
  cards: CardData[];
}

interface ListColumnProps {
  list: ListData;
  onCardClick: (card: CardData) => void;
  onListUpdated: () => void;
  onListDeleted: () => void;
  onCardCreated: () => void;
  hiddenCards?: Set<number>;
}

export function ListColumn({ list, onCardClick, onListUpdated, onListDeleted, onCardCreated, hiddenCards = new Set() }: ListColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [form] = Form.useForm();

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
      await listApi.delete(list.id);
      message.success('Lista excluída');
      onListDeleted();
    } catch {
      message.error('Erro ao excluir lista');
    }
  };

  const handleAddCard = async (values: { title: string }) => {
    try {
      await cardApi.create(list.id, { title: values.title });
      setIsAddingCard(false);
      form.resetFields();
      onCardCreated();
    } catch {
      message.error('Erro ao criar card');
    }
  };

  const menuItems = [
    { key: 'rename', icon: <EditOutlined />, label: 'Renomear', onClick: () => setIsEditing(true) },
    { type: 'divider' as const },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Excluir', danger: true, onClick: handleDelete },
  ];

  return (
    <div className={`list-column ${isOver ? 'drag-over' : ''}`} ref={setNodeRef}>
      <div className="list-header">
        {isEditing ? (
          <Form form={form} layout="inline" className="list-title-form">
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

      {isAddingCard ? (
        <div className="add-card-form">
          <Form form={form} layout="vertical" onFinish={handleAddCard}>
            <Form.Item name="title" rules={[{ required: true, message: 'Título é obrigatório' }]}>
              <Input placeholder="Título do card" autoFocus />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="small">Adicionar</Button>
              <Button size="small" onClick={() => { setIsAddingCard(false); form.resetFields(); }}>Cancelar</Button>
            </Space>
          </Form>
        </div>
      ) : (
        <Button
          type="text"
          icon={<PlusOutlined />}
          className="add-card-button"
          onClick={() => setIsAddingCard(true)}
        >
          Adicionar card
        </Button>
      )}
    </div>
  );
}
