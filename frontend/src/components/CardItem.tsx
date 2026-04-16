import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography, Tooltip } from 'antd';
import { LabelBadge } from './LabelBadge';
import './CardItem.css';

const { Text } = Typography;

export interface CardData {
  id: number;
  title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  labels?: { id: number; name: string; color: string }[];
  checklist_items?: { id: number; content: string; is_checked: boolean; position: number }[];
  comments_count?: number;
  attachments_count?: number;
  is_archived?: boolean;
}

interface CardItemProps {
  card: CardData;
  onClick: () => void;
  isHidden?: boolean;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).toDateString() === new Date().toDateString();
}

export function CardItem({ card, onClick, isHidden = false }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: isHidden ? 'none' : undefined,
  };

  const checklistTotal = card.checklist_items?.length ?? 0;
  const checklistDone = card.checklist_items?.filter(i => i.is_checked).length ?? 0;
  const overdue = isOverdue(card.due_date);
  const dueToday = isDueToday(card.due_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card-item ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      {card.labels && card.labels.length > 0 && (
        <div className="card-labels">
          {card.labels.map(label => (
            <LabelBadge key={label.id} name={label.name} color={label.color} size="small" />
          ))}
        </div>
      )}

      <Text className="card-title">{card.title}</Text>

      {card.description && (
        <Text className="card-description" ellipsis>
          {card.description}
        </Text>
      )}

      <div className="card-meta">
        {card.is_archived && (
          <Tooltip title="Card arquivado">
            <span className="card-archived">📦 Arquivado</span>
          </Tooltip>
        )}

        {card.due_date && (
          <Tooltip title={`Data de entrega: ${new Date(card.due_date).toLocaleDateString('pt-BR')}`}>
            <span className={`card-due ${overdue ? 'overdue' : ''} ${dueToday ? 'due-today' : ''}`}>
              {new Date(card.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </Tooltip>
        )}

        {checklistTotal > 0 && (
          <Tooltip title={`Checklist: ${checklistDone}/${checklistTotal}`}>
            <span className={`card-checklist ${checklistDone === checklistTotal ? 'complete' : ''}`}>
              ☑ {checklistDone}/{checklistTotal}
            </span>
          </Tooltip>
        )}

        {(card.comments_count ?? 0) > 0 && (
          <span className="card-comments">💬 {card.comments_count}</span>
        )}

        {(card.attachments_count ?? 0) > 0 && (
          <span className="card-attachments">📎 {card.attachments_count}</span>
        )}
      </div>
    </div>
  );
}