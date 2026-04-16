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
  Spin,
  message,
  Divider,
} from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined, CheckOutlined, MessageOutlined, PaperClipOutlined, InboxOutlined, FolderOpenOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import ReactMarkdown from 'react-markdown';
import { LabelBadge } from './LabelBadge';
import { cardApi, labelApi, checklistApi, commentApi, attachmentApi } from '../services/api';
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

export interface CardModalProps {
  card: CardData | null;
  boardId: number;
  listId?: number;
  mode: 'edit' | 'create';
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted?: () => void;
}

const LABEL_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

export function CardModal({ card, boardId, listId, mode, open, onClose, onUpdated, onDeleted }: CardModalProps) {
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
  const [deleting, setDeleting] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [cardId, setCardId] = useState<number | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [comments, setComments] = useState<{ id: number; content: string; user: { name: string }; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [attachments, setAttachments] = useState<{ id: number; file_name: string; file_size: number; created_at: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const isCreate = mode === 'create';

  useEffect(() => {
    if (!open) return;
    if (isCreate) {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setLabels([]);
      setChecklistItems([]);
      setEditingDescription(false);
      setCardId(null);
    } else if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? dayjs(card.due_date) : null);
      setLabels(card.labels || []);
      setChecklistItems(card.checklist_items || []);
      setEditingDescription(false);
      setCardId(card.id);
      setIsArchived((card as any).is_archived ?? false);
    }
    loadBoardLabels();

    const loadCardData = async () => {
      if (!isCreate && cardId) {
        setLoadingComments(true);
        try {
          const { data } = await commentApi.getByCard(cardId);
          setComments(data);
        } catch { /* ignore */ }
        setLoadingComments(false);
        try {
          const { data } = await attachmentApi.getByCard(cardId);
          setAttachments(data);
        } catch { /* ignore */ }
      }
    };
    loadCardData();
  }, [card, open, isCreate, cardId]);

  const loadBoardLabels = async () => {
    try {
      const { data } = await labelApi.getByBoard(boardId);
      setBoardLabels(data);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning('Título é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        const payload: Record<string, unknown> = {
          title: title.trim(),
          description: description || undefined,
          due_date: dueDate?.format('YYYY-MM-DD') || undefined,
          label_ids: labels.map(l => l.id),
        };
        const { data } = await cardApi.create(listId!, payload as Parameters<typeof cardApi.create>[1]);
        setCardId(data.id);
        message.success('Card criado');
      } else if (cardId) {
        await cardApi.update(cardId, {
          title,
          description: description || undefined,
          due_date: dueDate?.format('YYYY-MM-DD'),
          label_ids: labels.map(l => l.id),
        });
        message.success('Card atualizado');
      }
      onUpdated();
      onClose();
    } catch {
      message.error(isCreate ? 'Erro ao criar card' : 'Erro ao salvar card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cardId) return;
    setDeleting(true);
    try {
      await cardApi.delete(cardId);
      message.success('Card excluído');
      onDeleted?.();
      onClose();
    } catch {
      message.error('Erro ao excluir card');
    } finally {
      setDeleting(false);
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
    const targetId = cardId;
    if (!targetId || !newChecklistItem.trim()) return;
    try {
      const { data } = await checklistApi.create(targetId, newChecklistItem.trim());
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
    setCreatingLabel(true);
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
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleCreateAndContinue = async () => {
    if (!title.trim()) {
      message.warning('Título é obrigatório');
      return;
    }
    if (!listId) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description || undefined,
        due_date: dueDate?.format('YYYY-MM-DD') || undefined,
        label_ids: labels.map(l => l.id),
      };
      await cardApi.create(listId, payload as Parameters<typeof cardApi.create>[1]);
      message.success('Card criado');
      setTitle('');
      setDescription('');
      setDueDate(null);
      setLabels([]);
      setEditingDescription(false);
      onUpdated();
    } catch {
      message.error('Erro ao criar card');
    } finally {
      setSaving(false);
    }
  };

  const currentChecklistItems = isCreate ? [] : checklistItems;
  const checklistDone = currentChecklistItems.filter(i => i.is_checked).length;
  const checklistTotal = currentChecklistItems.length;

  return (
    <Modal
      open={open}
      onCancel={saving ? undefined : onClose}
      className="card-modal"
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>Cancelar</Button>,
        isCreate ? (
          <Button key="createAnother" onClick={handleCreateAndContinue} loading={saving} disabled={!title.trim()}>
            Criar e adicionar outro
          </Button>
        ) : null,
        <Button key="save" type="primary" loading={saving} onClick={handleSave} disabled={!title.trim()}>
          {isCreate ? 'Criar card' : 'Salvar'}
        </Button>,
      ]}
      width={640}
      title={isCreate ? 'Novo card' : (card?.title || 'Editar card')}
      maskClosable={!saving}
      closable={!saving}
    >
      <Spin spinning={saving} tip="Salvando...">
        <div className={saving ? 'modal-content-disabled' : ''}>
          <div className="modal-section">
            <label className="modal-section-label">Título *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título do card"
              onPressEnter={isCreate ? handleCreateAndContinue : undefined}
              disabled={saving}
              autoFocus={isCreate}
            />
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <label className="modal-section-label">Descrição</label>
              {!editingDescription && description && (
                <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setEditingDescription(true)} disabled={saving}>
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
                  disabled={saving}
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
              format="DD/MM/YYYY"
              placeholder="Selecione uma data"
              disabled={saving}
            />
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <label className="modal-section-label">Labels</label>
              <Button size="small" type="link" onClick={() => setShowLabelForm(!showLabelForm)} disabled={saving}>
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
                  disabled={saving}
                />
                <div className="label-color-grid">
                  {LABEL_COLORS.slice(0, 7).map(color => (
                    <div
                      key={color}
                      className={`label-color-swatch ${newLabelColor === color ? 'selected' : ''}`}
                      style={{ '--swatch-color': color } as React.CSSProperties}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
                <Button size="small" type="primary" onClick={handleCreateLabel} disabled={saving || creatingLabel} loading={creatingLabel}>Criar</Button>
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

          {!isCreate && cardId && (
            <>
              <Divider className="modal-divider" />

              <div className="modal-section">
                <label className="modal-section-label">
                  Checklist {checklistTotal > 0 && `(${checklistDone}/${checklistTotal})`}
                </label>
                {currentChecklistItems.map(item => (
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
                    disabled={saving}
                  />
                  <Button size="small" icon={<PlusOutlined />} onClick={handleAddChecklistItem} disabled={saving}>
                    Adicionar
                  </Button>
                </Space>
              </div>

              <Divider className="modal-divider" />
              <div className="modal-section">
                {isArchived ? (
                  <Button
                    icon={<FolderOpenOutlined />}
                    loading={archiveLoading}
                    disabled={archiveLoading}
                    onClick={async () => {
                      setArchiveLoading(true);
                      try {
                        await cardApi.restore(cardId!);
                        setIsArchived(false);
                        message.success('Card desarquivado');
                        onUpdated();
                      } catch {
                        message.error('Erro ao desarquivar');
                      } finally {
                        setArchiveLoading(false);
                      }
                    }}
                  >
                    Desarquivar
                  </Button>
                ) : (
                  <Button
                    icon={<InboxOutlined />}
                    loading={archiveLoading}
                    disabled={archiveLoading}
                    onClick={async () => {
                      setArchiveLoading(true);
                      try {
                        await cardApi.archive(cardId!);
                        setIsArchived(true);
                        message.success('Card arquivado');
                        onUpdated();
                        onClose();
                      } catch {
                        message.error('Erro ao arquivar');
                      } finally {
                        setArchiveLoading(false);
                      }
                    }}
                  >
                    Arquivar
                  </Button>
                )}
              </div>

              <Divider className="modal-divider" />
              <div className="modal-section">
                <div className="modal-section-header">
                  <label className="modal-section-label">
                    <MessageOutlined /> Comentários {comments.length > 0 && `(${comments.length})`}
                  </label>
                </div>
                <div className="comments-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <Text strong>{comment.user?.name || 'Usuário'}</Text>
                        <Text type="secondary" className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </Text>
                      </div>
                      <Text className="comment-content">{comment.content}</Text>
                    </div>
                  ))}
                  {comments.length === 0 && !loadingComments && (
                    <Text type="secondary" className="no-comments">Nenhum comentário ainda.</Text>
                  )}
                </div>
                <div className="comment-input-row">
                  <Input
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onPressEnter={async () => {
                      if (!newComment.trim() || !cardId) return;
                      try {
                        const { data } = await commentApi.create(cardId, newComment.trim());
                        setComments(prev => [...prev, data]);
                        setNewComment('');
                      } catch {
                        message.error('Erro ao adicionar comentário');
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={async () => {
                      if (!newComment.trim() || !cardId) return;
                      try {
                        const { data } = await commentApi.create(cardId, newComment.trim());
                        setComments(prev => [...prev, data]);
                        setNewComment('');
                      } catch {
                        message.error('Erro ao adicionar comentário');
                      }
                    }}
                  />
                </div>
              </div>

              <Divider className="modal-divider" />
              <div className="modal-section">
                <div className="modal-section-header">
                  <label className="modal-section-label">
                    <PaperClipOutlined /> Anexos {attachments.length > 0 && `(${attachments.length})`}
                  </label>
                </div>
                <div className="attachments-list">
                  {attachments.map(att => (
                    <div key={att.id} className="attachment-item">
                      <PaperClipOutlined />
                      <span className="attachment-name">{att.file_name}</span>
                      <Text type="secondary" className="attachment-size">
                        {Math.round(att.file_size / 1024)} KB
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={async () => {
                          try {
                            await attachmentApi.delete(att.id);
                            setAttachments(prev => prev.filter(a => a.id !== att.id));
                          } catch {
                            message.error('Erro ao remover anexo');
                          }
                        }}
                      />
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <Text type="secondary" className="no-attachments">Nenhum anexo.</Text>
                  )}
                </div>
                <input
                  type="file"
                  id={`attachment-input-${cardId}`}
                  className="attachment-file-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !cardId) return;
                    setUploading(true);
                    try {
                      const { data } = await attachmentApi.upload(cardId, file);
                      setAttachments(prev => [...prev, data]);
                      message.success('Anexo adicionado');
                    } catch {
                      message.error('Erro ao fazer upload');
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => document.getElementById(`attachment-input-${cardId}`)?.click()}
                  loading={uploading}
                  disabled={uploading}
                >
                  Adicionar anexo
                </Button>
              </div>

              <Divider className="modal-divider" />

              <Popconfirm
                title="Excluir este card?"
                description="Esta ação não pode ser desfeita."
                onConfirm={handleDelete}
                okText="Excluir"
                cancelText="Cancelar"
                okButtonProps={{ danger: true, loading: deleting }}
              >
                <Button danger icon={<DeleteOutlined />} className="delete-card-button" disabled={saving || deleting} loading={deleting}>
                  Excluir card
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      </Spin>
    </Modal>
  );
}