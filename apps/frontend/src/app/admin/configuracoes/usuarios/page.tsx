'use client'

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Shield, User, Search, ArrowUpDown, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Role = 'ADMIN' | 'SUPPORT' | 'USER';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantName?: string;
  createdAt: string;
  lastLogin?: string;
}

const DUMMY_USERS: User[] = [
    {
      id: '1',
      name: 'Admin Geral',
      email: 'admin@sistema.com',
      role: 'ADMIN',
      createdAt: '2023-01-15T09:30:00Z',
      lastLogin: '2023-10-26T10:00:00Z'
    },
    {
      id: '2',
      name: 'Técnico Suporte N1',
      email: 'suporte.n1@sistema.com',
      role: 'SUPPORT',
      tenantName: 'Todas as Escolas',
      createdAt: '2023-02-20T14:00:00Z',
      lastLogin: '2023-10-25T15:30:00Z'
    },
    {
      id: '3',
      name: 'Maria Diretora',
      email: 'maria.diretora@escolaabc.com',
      role: 'USER',
      tenantName: 'Escola ABC',
      createdAt: '2023-03-10T11:45:00Z',
      lastLogin: '2023-10-26T08:20:00Z'
    },
    {
      id: '4',
      name: 'José Coordenador',
      email: 'jose.coord@escolaxyz.com',
      role: 'USER',
      tenantName: 'Escola XYZ',
      createdAt: '2023-04-05T18:10:00Z',
      lastLogin: '2023-10-24T18:05:00Z'
    },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  useEffect(() => {
    setIsLoading(true);
    // Simulating API call
    setTimeout(() => {
      setUsers(DUMMY_USERS);
      setFilteredUsers(DUMMY_USERS);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let results = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.tenantName && user.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      results.sort((a, b) => {
        const key = sortConfig.key;
        // Handle cases where the key might not be a string
        const valA = a[key] ? String(a[key]) : '';
        const valB = b[key] ? String(b[key]) : '';
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredUsers(results);
  }, [searchTerm, users, sortConfig]);

  const handleSort = (field: keyof User) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === field && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: field, direction });
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditedUser({ ...user });
    setIsModalOpen(true);
  };
  
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedUser) {
      console.log(`Deleting user ${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSave = () => {
    if (selectedUser) {
        console.log(`Saving user ${selectedUser.id}`, editedUser);
    } else {
        console.log('Creating new user', editedUser)
    }
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    console.log(`Updating role for user ${userId} to ${newRole}`);
  };

    const formatDetails = (data: any) => {
    if (!data || !data.details) return 'N/A';
    
    // CORREÇÃO AQUI
    const details = Object.entries(data.details)
      .filter(([, count]) => (count as number) > 0) 
      .map(([key, count]) => `${key}: ${count}`)
      .join('\n');
      
    return details || 'Nenhuma atividade recente';
  };


  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
                <p className="text-gray-500">Adicione, edite e remova usuários do sistema.</p>
            </div>
            <button onClick={() => { setSelectedUser(null); setEditedUser({}); setIsModalOpen(true); }} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600">
                <Plus size={20} />
                <span>Novo Usuário</span>
            </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['name', 'role', 'tenantName', 'createdAt'].map((key) => (
                    <th key={key} onClick={() => handleSort(key as keyof User)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                        <div className="flex items-center">
                            {key === 'name' ? 'Usuário' : key === 'role' ? 'Nível' : key === 'tenantName' ? 'Escola/Lotação' : 'Criado em'}
                            <ArrowUpDown size={14} className="ml-1.5" />
                        </div>
                    </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.role === 'SUPPORT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.tenantName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={editedUser.name || ''} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} className="w-full p-2 border rounded" />
              <input type="email" placeholder="E-mail" value={editedUser.email || ''} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} className="w-full p-2 border rounded" />
              <select value={editedUser.role || ''} onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as Role })} className="w-full p-2 border rounded">
                <option value="USER">Usuário</option>
                <option value="SUPPORT">Suporte</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-red-500 text-white rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}

       {/* Modal de Exclusão */}
       {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center">
                <h3 className="text-lg font-bold mb-4">Confirmar Exclusão</h3>
                <p>Tem certeza que deseja excluir o usuário <span className="font-semibold">{selectedUser?.name}</span>?</p>
                <div className="mt-6 flex justify-center space-x-2">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Excluir</button>
                </div>
            </div>
        </div>
       )}
    </Card>
  );
}