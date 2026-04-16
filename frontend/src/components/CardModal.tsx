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
import { DeleteOutlined, PlusOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import ReactMarkdown from 'react-markdown';
import { LabelBadge } from './LabelBadge';
import { cardApi, labelApi, checklistApi } from '../services/api';
import type { CardData } from './CardItem';
import './CardModal.css';

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
  const [editingDescription, setEditingDescription] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card && open) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? dayjs(card.due_date) : null);
      setLabels(card.labels || []);
      setChecklistItems(card.checklist_items || []);
      setEditingDescription(false);
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
      className="card-modal"
      footer={[
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          Salvar
        </Button>,
      ]}
      width={640}
      title={card.title}
    >
      <div className="modal-section">
        <label className="modal-section-label">Título</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do card"
        />
      </div>

      <div className="modal-section">
        <div className="modal-section-header">
          <label className="modal-section-label">Descrição</label>
          {!editingDescription && description && (
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setEditingDescription(true)}>
              Editar
            </Button>
          )}
        </div>
        {editingDescription || !description ? (
          <>
            <TextArea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Adicione uma descrição... (suporta Markdown)"
              rows={4}
            />
            {description && (
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                onClick={() => setEditingDescription(false)}
                className="checklist-input-row"
              >
                Concluir edição
              </Button>
            )}
          </>
        ) : (
          <div className="description-preview" onClick={() => setEditingDescription(true)}>
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="modal-section">
        <label className="modal-section-label">Data de entrega</label>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          className="modal-date-picker"
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Selecione uma data"
        />
      </div>

      <div className="modal-section">
        <div className="modal-section-header">
          <label className="modal-section-label">Labels</label>
          <Button size="small" type="link" onClick={() => setShowLabelForm(!showLabelForm)}>
            {showLabelForm ? 'Cancelar' : '+ Criar label'}
          </Button>
        </div>

        {showLabelForm && (
          <div className="label-create-form">
            <Input
              size="small"
              placeholder="Nome do label"
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              className="label-input"
            />
            <div className="label-color-grid">
              {LABEL_COLORS.slice(0, 7).map(color => (
                <div
                  key={color}
                  className={`label-color-swatch ${newLabelColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewLabelColor(color)}
                />
              ))}
            </div>
            <Button size="small" type="primary" onClick={handleCreateLabel}>Criar</Button>
          </div>
        )}

        <div className="label-list">
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
          <div className="selected-labels">
            <Text type="secondary" className="selected-labels-label">Selecionados:</Text>
            <div className="selected-labels-list">
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

      <Divider className="modal-divider" />

      <div className="modal-section">
        <label className="modal-section-label">
          Checklist {checklistTotal > 0 && `(${checklistDone}/${checklistTotal})`}
        </label>
        {checklistItems.map(item => (
          <div key={item.id} className="checklist-item-row">
            <Checkbox
              checked={item.is_checked}
              onChange={() => handleToggleChecklistItem(item)}
            />
            <span className={`checklist-item-text ${item.is_checked ? 'done' : ''}`}>
              {item.content}
            </span>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteChecklistItem(item.id)} />
          </div>
        ))}
        <Space className="checklist-input-row">
          <Input
            size="small"
            placeholder="Novo item..."
            value={newChecklistItem}
            onChange={e => setNewChecklistItem(e.target.value)}
            onPressEnter={handleAddChecklistItem}
          />
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddChecklistItem}>
            Adicionar
          </Button>
        </Space>
      </div>

      <Divider className="modal-divider" />

      <Popconfirm
        title="Excluir este card?"
        description="Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <Button danger icon={<DeleteOutlined />} className="delete-card-button">
          Excluir card
        </Button>
      </Popconfirm>
    </Modal>
  );
}