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

interface Member {
  id: number;
  user_id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
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
  const [addRole, setAddRole] = useState<'admin' | 'member'>('member');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (open) loadMembers();
  }, [open, boardId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await memberApi.getByBoard(boardId);
      setMembers(data);
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
      setMembers(prev => [...prev, data]);
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
    try {
      await memberApi.remove(boardId, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      message.success('Membro removido');
      onUpdated();
    } catch {
      message.error('Erro ao remover membro');
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: 'admin' | 'member') => {
    try {
      await memberApi.updateRole(boardId, memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      message.success('Função atualizada');
      onUpdated();
    } catch {
      message.error('Erro ao atualizar função');
    }
  };

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
            onChange={setAddRole}
            style={{ width: 110 }}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'member', label: 'Membro' },
            ]}
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
                onChange={(val) => handleUpdateRole(member.id, val)}
                size="small"
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'member', label: 'Membro' },
                ]}
              />,
              <Popconfirm
                key="remove"
                title="Remover este membro?"
                description="Ele perderá acesso ao quadro."
                onConfirm={() => handleRemoveMember(member.id)}
                okText="Remover"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
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
