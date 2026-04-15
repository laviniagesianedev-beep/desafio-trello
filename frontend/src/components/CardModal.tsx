import { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Input,
  DatePicker,
  Button,
  Space,
  Checkbox,
  Popconfirm,
  message,
  Divider,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { LabelBadge } from './LabelBadge';
import { cardApi, labelApi, checklistApi } from '../services/api';
import type { CardData } from './CardItem';

const { Text } = Typography;
const { TextArea } = Input;

interface Label {
  id: number;
  name: string;
  color: string;
}

interface ChecklistItem {
  id: number;
  content: string;
  is_checked: boolean;
  position: number;
}

interface CardModalProps {
  card: CardData | null;
  boardId: number;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const LABEL_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

export function CardModal({ card, boardId, open, onClose, onUpdated, onDeleted }: CardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card && open) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? dayjs(card.due_date) : null);
      setLabels(card.labels || []);
      setChecklistItems(card.checklist_items || []);
      loadBoardLabels();
    }
  }, [card, open]);

  const loadBoardLabels = async () => {
    try {
      const { data } = await labelApi.getByBoard(boardId);
      setBoardLabels(data);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!card) return;
    setSaving(true);
    try {
      await cardApi.update(card.id, {
        title,
        description: description || undefined,
        due_date: dueDate?.format('YYYY-MM-DD'),
        label_ids: labels.map(l => l.id),
      });
      message.success('Card atualizado');
      onUpdated();
      onClose();
    } catch {
      message.error('Erro ao salvar card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    try {
      await cardApi.delete(card.id);
      message.success('Card excluído');
      onDeleted();
      onClose();
    } catch {
      message.error('Erro ao excluir card');
    }
  };

  const toggleLabel = (label: Label) => {
    setLabels(prev =>
      prev.some(l => l.id === label.id)
        ? prev.filter(l => l.id !== label.id)
        : [...prev, label]
    );
  };

  const handleAddChecklistItem = async () => {
    if (!card || !newChecklistItem.trim()) return;
    try {
      const { data } = await checklistApi.create(card.id, newChecklistItem.trim());
      setChecklistItems(prev => [...prev, data]);
      setNewChecklistItem('');
    } catch {
      message.error('Erro ao adicionar item');
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    try {
      await checklistApi.update(item.id, { is_checked: !item.is_checked });
      setChecklistItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i)
      );
    } catch {
      message.error('Erro ao atualizar item');
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    try {
      await checklistApi.delete(itemId);
      setChecklistItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      message.error('Erro ao remover item');
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const { data } = await labelApi.create(boardId, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setBoardLabels(prev => [...prev, data]);
      setLabels(prev => [...prev, data]);
      setNewLabelName('');
      setShowLabelForm(false);
    } catch {
      message.error('Erro ao criar label');
    }
  };

  const checklistDone = checklistItems.filter(i => i.is_checked).length;
  const checklistTotal = checklistItems.length;

  if (!card) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          Salvar
        </Button>,
      ]}
      width={640}
      title={<span style={{ fontSize: '1.1rem' }}>{card.title}</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>Título</Text>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do card"
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>Descrição</Text>
          <TextArea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Adicione uma descrição..."
            rows={3}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>Data de entrega</Text>
          <DatePicker
            value={dueDate}
            onChange={setDueDate}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Selecione uma data"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>Labels</Text>
            <Button size="small" type="link" onClick={() => setShowLabelForm(!showLabelForm)}>
              {showLabelForm ? 'Cancelar' : '+ Criar label'}
            </Button>
          </div>

          {showLabelForm && (
            <Space style={{ marginBottom: 8 }}>
              <Input
                size="small"
                placeholder="Nome do label"
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                style={{ width: 120 }}
              />
              <Space size={4}>
                {LABEL_COLORS.slice(0, 6).map(color => (
                  <div
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: newLabelColor === color ? '2px solid #000' : '1px solid #ccc',
                    }}
                  />
                ))}
              </Space>
              <Button size="small" type="primary" onClick={handleCreateLabel}>
                Criar
              </Button>
            </Space>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {boardLabels.map(label => (
              <LabelBadge
                key={label.id}
                name={label.name}
                color={label.color}
                onClick={() => toggleLabel(label)}
              />
            ))}
          </div>
          {labels.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>Selecionados:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {labels.map(label => (
                  <LabelBadge
                    key={label.id}
                    name={label.name}
                    color={label.color}
                    removable
                    onRemove={() => toggleLabel(label)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>
            Checklist {checklistTotal > 0 && `(${checklistDone}/${checklistTotal})`}
          </Text>
          {checklistItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Checkbox
                checked={item.is_checked}
                onChange={() => handleToggleChecklistItem(item)}
              />
              <span style={{ flex: 1, textDecoration: item.is_checked ? 'line-through' : 'none', color: item.is_checked ? '#999' : 'inherit' }}>
                {item.content}
              </span>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteChecklistItem(item.id)} />
            </div>
          ))}
          <Space style={{ marginTop: 8 }}>
            <Input
              size="small"
              placeholder="Novo item..."
              value={newChecklistItem}
              onChange={e => setNewChecklistItem(e.target.value)}
              onPressEnter={handleAddChecklistItem}
              style={{ width: 200 }}
            />
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddChecklistItem}>
              Adicionar
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <Popconfirm
          title="Excluir este card?"
          description="Esta ação não pode ser desfeita."
          onConfirm={handleDelete}
          okText="Excluir"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />}>
            Excluir card
          </Button>
        </Popconfirm>
      </div>
    </Modal>
  );
}
