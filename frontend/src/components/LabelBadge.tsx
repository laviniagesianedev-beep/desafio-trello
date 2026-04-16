import { Tag } from 'antd';
import './LabelBadge.css';

interface LabelBadgeProps {
  name: string;
  color: string;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  size?: 'small' | 'default';
}

const LABEL_COLORS_MAP: Record<string, string> = {
  '#EF4444': '#FEE2E2',
  '#F97316': '#FFEDD5',
  '#F59E0B': '#FEF3C7',
  '#84CC16': '#ECFCCB',
  '#22C55E': '#DCFCE7',
  '#14B8A6': '#CCFBF1',
  '#06B6D4': '#CFFAFE',
  '#3B82F6': '#DBEAFE',
  '#6366F1': '#E0E7FF',
  '#8B5CF6': '#EDE9FE',
  '#A855F7': '#F3E8FF',
  '#D946EF': '#FAE8FF',
  '#EC4899': '#FCE7F3',
  '#F43F5E': '#FFE4E6',
};

function hexToRgba(hex: string, alpha: number = 0.2): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LabelBadge({ name, color, onClick, onRemove, removable, size = 'default' }: LabelBadgeProps) {
  const bgColor = LABEL_COLORS_MAP[color] || hexToRgba(color, 0.15);

  return (
    <Tag
      className={`label-badge ${onClick ? 'clickable' : ''} ${size === 'small' ? 'small' : ''}`}
      style={{
        '--label-bg': bgColor,
        '--label-border': color,
        '--label-text': color,
      } as React.CSSProperties}
      onClick={onClick}
      closable={removable}
      onClose={onRemove}
    >
      {name}
    </Tag>
  );
}