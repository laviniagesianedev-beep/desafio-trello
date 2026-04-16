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
import { DeleteOutlined, PlusOutlined, EditOutlined, MessageOutlined, PaperClipOutlined, InboxOutlined, FolderOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { LabelBadge } from './LabelBadge';
import { RichTextEditor, RichTextViewer } from './RichTextEditor';
import { cardApi, labelApi, checklistApi, commentApi, attachmentApi } from '../services/api';
import type { CardData } from './CardItem';
import './CardModal.css';

const { Text } = Typography;

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
  const [comments, setComments] = useState<{
    id: number;
    content: string;
    author_id: number;
    author_name: string;
    created_at: string;
    updated_at: string;
    can_edit: boolean;
  }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [updatingComment, setUpdatingComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [attachments, setAttachments] = useState<{ id: number; file_name: string; file_size: number; file_type?: string; created_at: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const isCreate = mode === 'create';

  useEffect(() => {
    if (!open) {
      setIsDataLoaded(false);
      return;
    }
    
    setIsDataLoaded(false);
    
    if (isCreate) {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setLabels([]);
      setChecklistItems([]);
      setComments([]);
      setAttachments([]);
      setBoardLabels([]);
      setEditingDescription(false);
      setCardId(null);
      setIsArchived(false);
      setIsDataLoaded(true);
      loadBoardLabels();
    } else if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? dayjs(card.due_date) : null);
      setLabels(card.labels || []);
      setChecklistItems(card.checklist_items || []);
      setComments([]);
      setAttachments([]);
      setBoardLabels([]);
      setEditingDescription(false);
      setCardId(card.id);
      setIsArchived((card as any).is_archived ?? false);
      setIsDataLoaded(true);
      loadAllCardData();
    }
  }, [open, isCreate]);

  const loadBoardLabels = async () => {
    try {
      const { data } = await labelApi.getByBoard(boardId);
      setBoardLabels(data);
    } catch {
      // ignore
    }
  };

  const loadAllCardData = async () => {
    if (!cardId) return;
    
    const targetId = cardId;
    
    try {
      const [labelsRes, commentsRes, attachmentsRes] = await Promise.all([
        labelApi.getByBoard(boardId).catch(() => ({ data: [] })),
        commentApi.getByCard(targetId).catch(() => ({ data: [] })),
        attachmentApi.getByCard(targetId).catch(() => ({ data: [] })),
      ]);
      setBoardLabels(labelsRes.data);
      setComments(commentsRes.data);
      setAttachments(attachmentsRes.data);
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

  const handleArchive = async () => {
    if (!cardId) return;
    setArchiveLoading(true);
    try {
      if (isArchived) {
        await cardApi.restore(cardId);
        setIsArchived(false);
        message.success('Card desarquivado');
      } else {
        await cardApi.archive(cardId);
        setIsArchived(true);
        message.success('Card arquivado');
      }
      onUpdated();
      onClose();
    } catch {
      message.error(isArchived ? 'Erro ao desarquivar' : 'Erro ao arquivar');
    } finally {
      setArchiveLoading(false);
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

  const handlePreviewAttachment = async (att: { id: number; file_name: string; file_type?: string }) => {
    setPreviewLoading(true);
    try {
      const { data } = await attachmentApi.preview(att.id);
      setPreviewUrl(data.url);
      setPreviewFileName(data.file_name);
      setPreviewModalOpen(true);
    } catch {
      message.error('Erro ao carregar preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const isImageFile = (fileType?: string) => {
    if (!fileType) return false;
    return fileType.startsWith('image/');
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

  const ensureCardAndThen = async (callback: (cid: number) => Promise<void>) => {
    let targetId = cardId;
    if (!targetId) {
      if (!title.trim()) {
        message.warning('Título é obrigatório');
        return;
      }
      if (!listId) return;
      try {
        setSaving(true);
        const payload: Record<string, unknown> = {
          title: title.trim(),
          description: description || undefined,
          due_date: dueDate?.format('YYYY-MM-DD') || undefined,
          label_ids: labels.map(l => l.id),
        };
        const { data } = await cardApi.create(listId, payload as Parameters<typeof cardApi.create>[1]);
        setCardId(data.id);
        targetId = data.id;
        onUpdated();
      } catch {
        message.error('Erro ao criar card');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    if (targetId) {
      await callback(targetId);
    }
  };

  const isLoading = saving || (!isCreate && !isDataLoaded);
  
  return (
    <Modal
      open={open}
      onCancel={isLoading ? undefined : onClose}
      className="card-modal"
      footer={isLoading ? null : [
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
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      <Spin spinning={isLoading} tip={saving ? "Salvando..." : "Carregando..."}>
        <div className={isLoading ? 'modal-content-disabled' : ''}>
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
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Adicione uma descrição com formatação..."
                minHeight={120}
              />
            ) : (
              <div className="description-preview" onClick={() => setEditingDescription(true)}>
                <RichTextViewer content={description} />
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

          <Divider className="modal-divider" />

          <div className="modal-section">
            <label className="modal-section-label">
              Checklist {checklistTotal > 0 && `(${checklistDone}/${checklistTotal})`}
            </label>
            {isCreate ? (
              <Text type="secondary" className="checklist-create-hint">
                Após criar o card, você poderá adicionar itens ao checklist.
              </Text>
            ) : (
              <>
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
              </>
            )}
          </div>

          {!isCreate && cardId && (
            <>
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
                        <Text strong>{comment.author_name}</Text>
                        <Text type="secondary" className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {comment.updated_at !== comment.created_at && ' (editado)'}
                        </Text>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="comment-edit-form">
                          <RichTextEditor
                            content={editingCommentContent}
                            onChange={setEditingCommentContent}
                            placeholder="Edite seu comentário..."
                            minHeight={80}
                          />
                          <div className="comment-edit-actions">
                            <Button size="small" onClick={() => setEditingCommentId(null)}>
                              Cancelar
                            </Button>
                            <Button 
                              size="small" 
                              type="primary" 
                              icon={<SaveOutlined />}
                              loading={updatingComment}
                              onClick={async () => {
                                if (!editingCommentContent.trim()) return;
                                setUpdatingComment(true);
                                try {
                                  const { data } = await commentApi.update(comment.id, editingCommentContent);
                                  setComments(prev => prev.map(c => c.id === comment.id ? data : c));
                                  setEditingCommentId(null);
                                  message.success('Comentário atualizado');
                                } catch {
                                  message.error('Erro ao atualizar comentário');
                                } finally {
                                  setUpdatingComment(false);
                                }
                              }}
                            >
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="comment-content">
                            <RichTextViewer content={comment.content} />
                          </div>
                          {comment.can_edit && (
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<EditOutlined />}
                              className="edit-comment-button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentContent(comment.content);
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && isDataLoaded && (
                    <Text type="secondary" className="no-comments">Nenhum comentário ainda.</Text>
                  )}
                </div>
                <div className="comment-input-row">
                  <RichTextEditor
                    content={newComment}
                    onChange={setNewComment}
                    placeholder="Adicione um comentário..."
                    minHeight={80}
                  />
                  <Button
                    type="primary"
                    icon={submittingComment ? <Spin size="small" /> : <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>{'>'}</Text>}
                    loading={submittingComment}
                    className="submit-comment-button"
                    onClick={async () => {
                      if (!newComment.trim() || newComment === '<p></p>') return;
                      setSubmittingComment(true);
                      await ensureCardAndThen(async (cid) => {
                        try {
                          const { data } = await commentApi.create(cid, newComment);
                          setComments(prev => [data, ...prev]);
                          setNewComment('');
                        } catch {
                          message.error('Erro ao adicionar comentário');
                        } finally {
                          setSubmittingComment(false);
                        }
                      });
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
                      <Button
                        type="link"
                        size="small"
                        className="attachment-name"
                        onClick={() => handlePreviewAttachment(att)}
                        loading={previewLoading}
                      >
                        {att.file_name}
                      </Button>
                      <Text type="secondary" className="attachment-size">
                        {Math.round(att.file_size / 1024)} KB
                      </Text>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingAttachmentId === att.id}
                        onClick={async () => {
                          setDeletingAttachmentId(att.id);
                          try {
                            await attachmentApi.delete(att.id);
                            setAttachments(prev => prev.filter(a => a.id !== att.id));
                          } catch {
                            message.error('Erro ao remover anexo');
                          } finally {
                            setDeletingAttachmentId(null);
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
                  id={`attachment-input-${cardId || 'new'}`}
                  className="attachment-file-input"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await ensureCardAndThen(async (cid) => {
                      setUploading(true);
                      try {
                        const { data } = await attachmentApi.upload(cid, file);
                        setAttachments(prev => [...prev, data]);
                        message.success('Anexo adicionado');
                      } catch {
                        message.error('Erro ao fazer upload');
                      } finally {
                        setUploading(false);
                        e.target.value = '';
                      }
                    });
                  }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => document.getElementById(`attachment-input-${cardId || 'new'}`)?.click()}
                  loading={uploading}
                  disabled={uploading}
                >
                  Adicionar anexo
                </Button>
              </div>

              <Divider className="modal-divider" />

              <div className="modal-section modal-section-actions">
                <Button
                  icon={isArchived ? <FolderOutlined /> : <InboxOutlined />}
                  loading={archiveLoading}
                  disabled={archiveLoading}
                  onClick={handleArchive}
                >
                  {isArchived ? 'Desarquivar' : 'Arquivar'}
                </Button>

                <Popconfirm
                  title="Excluir este card?"
                  description="Esta ação não pode ser desfeita."
                  onConfirm={handleDelete}
                  okText="Excluir"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true, loading: deleting }}
                >
                  <Button danger icon={<DeleteOutlined />} disabled={saving || deleting} loading={deleting}>
                    Excluir
                  </Button>
                </Popconfirm>
              </div>
            </>
          )}
        </div>
      </Spin>

      <Modal
        title={previewFileName}
        open={previewModalOpen}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewUrl(null);
        }}
        footer={[
          <Button key="download" type="primary" icon={<PaperClipOutlined />} onClick={() => {
            if (previewUrl) {
              window.open(previewUrl, '_blank');
            }
          }}>
            Abrir em nova aba
          </Button>,
        ]}
        width={800}
      >
        <Spin spinning={previewLoading}>
          {previewUrl && isImageFile(attachments.find(a => a.file_name === previewFileName)?.file_type) ? (
            <img 
              src={previewUrl} 
              alt={previewFileName} 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
            />
          ) : previewUrl ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <PaperClipOutlined style={{ fontSize: 48, color: '#999' }} />
              <p style={{ marginTop: 16 }}>Clique em "Abrir em nova aba" para visualizar o arquivo</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">Carregando preview...</Text>
            </div>
          )}
        </Spin>
      </Modal>
    </Modal>
  );
}