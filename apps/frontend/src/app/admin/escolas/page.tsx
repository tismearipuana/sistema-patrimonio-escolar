'use client'

import { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit, Trash2, AlertTriangle, Save, XCircle, ArrowUpDown } from 'lucide-react';

// Interfaces
interface Contato {
  responsavel: string;
  email: string;
  telefone: string;
}

interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
}

interface Escola {
  id: string;
  nome: string;
  codigoMec: string;
  contato: Contato;
  endereco: Endereco;
  totalAtivos: number;
  totalChamados: number;
}

const initialEscolaData: Escola = {
  id: '',
  nome: '',
  codigoMec: '',
  contato: { responsavel: '', email: '', telefone: '' },
  endereco: { rua: '', numero: '', bairro: '', cidade: '', cep: '' },
  totalAtivos: 0,
  totalChamados: 0,
};

export default function EscolasPage() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [filteredEscolas, setFilteredEscolas] = useState<Escola[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escolaEditando, setEscolaEditando] = useState<Escola | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [escolaParaDeletar, setEscolaParaDeletar] = useState<Escola | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Escola; direction: 'ascending' | 'descending' } | null>(null);

  // Simulação de chamada de API
  useEffect(() => {
    const fetchEscolas = async () => {
      setIsLoading(true);
      try {
        // Simulação de dados
        const data: Escola[] = [
          {
            id: '1',
            nome: 'E.M. Prof. João da Silva',
            codigoMec: '12345678',
            contato: { responsavel: 'Maria Oliveira', email: 'maria.o@email.com', telefone: '(11) 98765-4321' },
            endereco: { rua: 'Rua das Flores', numero: '123', bairro: 'Centro', cidade: 'São Paulo', cep: '01000-000' },
            totalAtivos: 150,
            totalChamados: 12,
          },
          {
            id: '2',
            nome: 'C.E.I. Cantinho Feliz',
            codigoMec: '87654321',
            contato: { responsavel: 'José Pereira', email: 'jose.p@email.com', telefone: '(21) 91234-5678' },
            endereco: { rua: 'Avenida Principal', numero: '456', bairro: 'Copacabana', cidade: 'Rio de Janeiro', cep: '22000-000' },
            totalAtivos: 75,
            totalChamados: 5,
          },
        ];
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEscolas(data);
        setFilteredEscolas(data);
      } catch (err) {
        setError('Não foi possível carregar as escolas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEscolas();
  }, []);

  // Filtragem e Ordenação
  useEffect(() => {
    let escolasFiltradas = escolas.filter(escola =>
      escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escola.codigoMec.includes(searchTerm)
    );

    if (sortConfig !== null) {
      escolasFiltradas.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredEscolas(escolasFiltradas);
  }, [searchTerm, sortConfig, escolas]);

  // Funções de CRUD
  const handleOpenModal = (escola: Escola | null) => {
    setEscolaEditando(escola ? { ...escola } : initialEscolaData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEscolaEditando(null);
  };

  const handleSaveEscola = async () => {
    if (!escolaEditando) return;
    // Lógica de salvar (simulação)
    console.log('Salvando:', escolaEditando);
    handleCloseModal();
  };
  
  const handleDeleteClick = (escola: Escola) => {
    setEscolaParaDeletar(escola);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!escolaParaDeletar) return;
    // Lógica de deletar (simulação)
    console.log('Deletando:', escolaParaDeletar.id);
    setIsDeleteConfirmOpen(false);
    setEscolaParaDeletar(null);
  };

  const requestSort = (key: keyof Escola) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Escolas</h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600"
        >
          <PlusCircle size={20} />
          <span>Adicionar Escola</span>
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou código MEC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['nome', 'codigoMec', 'totalAtivos', 'totalChamados'].map((key) => (
                <th
                  key={key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort(key as keyof Escola)}
                >
                  <div className="flex items-center">
                    {key.replace('total', 'Total de ')}
                    <ArrowUpDown size={14} className="ml-1.5" />
                  </div>
                </th>
              ))}
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEscolas.map((escola) => (
              <tr key={escola.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{escola.nome}</div>
                    <div className="text-sm text-gray-500">{escola.contato.responsavel}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escola.codigoMec}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escola.totalAtivos}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{escola.totalChamados}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(escola)} className="text-indigo-600 hover:text-indigo-900">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDeleteClick(escola)} className="text-red-600 hover:text-red-900 ml-4">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{escolaEditando?.id ? 'Editar Escola' : 'Adicionar Nova Escola'}</h2>
            
            {/* Formulário */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome da Escola"
                value={escolaEditando?.nome || ''}
                onChange={(e) => setEscolaEditando({ ...escolaEditando!, nome: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Código MEC"
                value={escolaEditando?.codigoMec || ''}
                onChange={(e) => setEscolaEditando({ ...escolaEditando!, codigoMec: e.target.value })}
                className="w-full p-2 border rounded"
              />
               <input
                type="text"
                placeholder="Responsável"
                value={escolaEditando?.contato?.responsavel || ''}
                onChange={(e) => setEscolaEditando({ ...escolaEditando!, contato: { ...escolaEditando!.contato, responsavel: e.target.value } })}
                className="w-full p-2 border rounded"
              />
               <input
                type="email"
                placeholder="Email de Contato"
                value={escolaEditando?.contato?.email || ''}
                onChange={(e) => setEscolaEditando({ ...escolaEditando!, contato: { ...escolaEditando!.contato, email: e.target.value } })}
                className="w-full p-2 border rounded"
              />
               <input
                type="tel"
                placeholder="Telefone"
                value={escolaEditando?.contato?.telefone || ''}
                onChange={(e) => setEscolaEditando({ ...escolaEditando!, contato: { ...escolaEditando!.contato, telefone: e.target.value } })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={handleCloseModal} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
              <button onClick={handleSaveEscola} className="bg-red-500 text-white px-4 py-2 rounded">Salvar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Confirmação de Exclusão */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
             <div className="flex flex-col items-center text-center">
                <AlertTriangle className="text-red-500 h-16 w-16 mb-4" />
                <h2 className="text-xl font-bold mb-2">Confirmar Exclusão</h2>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir a escola <span className="font-bold">{escolaParaDeletar?.nome}</span>? Esta ação não pode ser desfeita.
                </p>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="bg-gray-300 px-6 py-2 rounded">Cancelar</button>
              <button onClick={confirmDelete} className="bg-red-600 text-white px-6 py-2 rounded">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}