import { useState, useEffect } from 'react';
import {
  Modal,
  List,
  Avatar,
  Button,
  Input,
  Select,
  Typography,
  message,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { memberApi } from '../services/api';
import './MembersModal.css';

const { Text } = Typography;

type RoleType = 'admin' | 'moderator' | 'normal' | 'observer';

interface Member {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: RoleType;
}

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  boardId: number;
  onUpdated: () => void;
}

export function MembersModal({ open, onClose, boardId, onUpdated }: MembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingEmail, setAddingEmail] = useState('');
  const [addRole, setAddRole] = useState<RoleType>('normal');
  const [addLoading, setAddLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (open) loadMembers();
  }, [open, boardId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.getByBoard(boardId);
      const formattedMembers: Member[] = data.map((m: any) => ({
        id: m.id,
        user_id: m.pivot?.user_id || m.id,
        name: m.name,
        email: m.email,
        role: (m.pivot?.role || m.role || 'normal') as RoleType,
      }));
      setMembers(formattedMembers);
    } catch {
      message.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!addingEmail.trim()) {
      message.warning('Informe o email do membro');
      return;
    }
    setAddLoading(true);
    try {
      const { data } = await memberApi.add(boardId, addingEmail.trim(), addRole);
      const newMember: Member = {
        id: data.id,
        user_id: data.id,
        name: data.name,
        email: data.email,
        role: (data.role || addRole) as RoleType,
      };
      setMembers(prev => [...prev, newMember]);
      setAddingEmail('');
      message.success('Membro adicionado');
      onUpdated();
    } catch {
      message.error('Erro ao adicionar membro. Verifique o email.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setRemovingIds(prev => new Set(prev).add(memberId));
    try {
      await memberApi.remove(boardId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      message.success('Membro removido');
      onUpdated();
    } catch {
      message.error('Erro ao remover membro');
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: RoleType) => {
    setUpdatingRoleId(memberId);
    try {
      await memberApi.updateRole(boardId, memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      message.success('Função atualizada');
      onUpdated();
    } catch {
      message.error('Erro ao atualizar função');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderador' },
    { value: 'normal', label: 'Normal' },
    { value: 'observer', label: 'Observador' },
  ];

  return (
    <Modal
      title="Gerenciar membros"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      className="members-modal"
    >
      <div className="members-add-form">
        <Text type="secondary" className="members-form-label">Adicionar membro:</Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<MailOutlined />}
            placeholder="Email do membro"
            value={addingEmail}
            onChange={e => setAddingEmail(e.target.value)}
            onPressEnter={handleAddMember}
            style={{ flex: 1 }}
          />
          <Select
            value={addRole}
            onChange={(val) => setAddRole(val as RoleType)}
            style={{ width: 120 }}
            options={roleOptions}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMember}
            loading={addLoading}
          >
            Adicionar
          </Button>
        </Space.Compact>
      </div>

      <List
        className="members-list"
        loading={loading}
        dataSource={members}
        locale={{ emptyText: 'Nenhum membro além do dono do quadro.' }}
        renderItem={(member) => (
          <List.Item
            key={member.id}
            actions={[
              <Select
                key="role"
                value={member.role}
                onChange={(val) => handleUpdateRole(member.id, val as RoleType)}
                size="small"
                style={{ minWidth: 100 }}
                loading={updatingRoleId === member.id}
                disabled={updatingRoleId === member.id}
                options={roleOptions}
              />,
              <Popconfirm
                key="remove"
                title="Remover este membro?"
                description="Ele perderá acesso ao quadro."
                onConfirm={() => handleRemoveMember(member.id)}
                okText="Remover"
                cancelText="Cancelar"
                okButtonProps={{ danger: true, loading: removingIds.has(member.id) }}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  loading={removingIds.has(member.id)}
                  disabled={removingIds.has(member.id)}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: '#7C6DD8', flexShrink: 0 }}
                  icon={<UserOutlined />}
                >
                  {member.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              }
              title={member.name}
              description={member.email}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
