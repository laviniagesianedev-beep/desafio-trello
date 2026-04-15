import { Tag } from 'antd';

interface LabelBadgeProps {
  name: string;
  color: string;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  size?: 'small' | 'default';
}

function hexToRgba(hex: string, alpha: number = 0.2): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LabelBadge({ name, color, onClick, onRemove, removable, size = 'default' }: LabelBadgeProps) {
  return (
    <Tag
      style={{
        backgroundColor: hexToRgba(color, 0.2),
        borderColor: color,
        color: color,
        fontSize: size === 'small' ? '0.7rem' : '0.75rem',
        padding: size === 'small' ? '0 4px' : '2px 8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      closable={removable}
      onClose={onRemove}
    >
      {name}
    </Tag>
  );
}
