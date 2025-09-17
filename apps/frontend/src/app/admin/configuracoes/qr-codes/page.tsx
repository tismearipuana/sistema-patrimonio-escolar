// src/app/admin/configuracoes/qr-codes/page - "Página Administrativa de Configurações de QR-Codes"
'use client'

import { useState, useEffect } from 'react'
import { QrCode, Download, Printer, Grid, List, Search, CheckSquare, Square, Eye, Package } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Asset {
  id: string
  code: string
  name: string
  category: string
  brand?: string
  model?: string
  status: string
  tenant: {
    id: string
    name: string
    code: string
  }
}

interface Tenant {
  id: string
  name: string
  code: string
}

export default function QRCodesPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [schools, setSchools] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Estados de ação
  const [downloading, setDownloading] = useState(false)

  const categories = ['INFORMATICA', 'AUDIOVISUAL', 'MOBILE', 'REDE', 'IMPRESSAO', 'OUTROS']
  const statusOptions = ['ATIVO', 'INATIVO', 'MANUTENCAO', 'BAIXADO']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // URLs corretas conforme o padrão do sistema
      const [assetsResponse, schoolsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/assets`).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants`).then(res => res.json())
      ])
      
      setAssets(assetsResponse.assets || [])
      setSchools(schoolsResponse.tenants || [])
      
      console.log('Assets loaded:', assetsResponse.assets)
      console.log('Schools loaded:', schoolsResponse.tenants)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setAssets([])
      setSchools([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar ativos
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSchool = !selectedSchool || asset.tenant.id === selectedSchool
    const matchesCategory = !selectedCategory || asset.category === selectedCategory
    const matchesStatus = !selectedStatus || asset.status === selectedStatus

    return matchesSearch && matchesSchool && matchesCategory && matchesStatus
  })

  // Seleção de ativos
  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets)
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId)
    } else {
      newSelected.add(assetId)
    }
    setSelectedAssets(newSelected)
  }

  const selectAllVisible = () => {
    const allVisibleIds = new Set(filteredAssets.map(asset => asset.id))
    setSelectedAssets(allVisibleIds)
  }

  const clearSelection = () => {
    setSelectedAssets(new Set())
  }

  // Download de QR codes
  const downloadQRCode = async (assetId: string, assetCode: string) => {
    try {
      const link = document.createElement('a')
      link.href = `${process.env.NEXT_PUBLIC_API_URL}/qrcode/asset/${assetId}`
      link.download = `qrcode-${assetCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao baixar QR code:', error)
      alert('Erro ao baixar QR code')
    }
  }

  const downloadMultipleQRCodes = async () => {
    if (selectedAssets.size === 0) {
      alert('Selecione pelo menos um ativo!')
      return
    }

    setDownloading(true)
    try {
      for (const assetId of selectedAssets) {
        const asset = assets.find(a => a.id === assetId)
        if (asset) {
          await downloadQRCode(assetId, asset.code)
          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      alert(`${selectedAssets.size} QR codes baixados com sucesso!`)
    } catch (error) {
      console.error('Erro ao baixar QR codes:', error)
      alert('Erro ao baixar alguns QR codes')
    } finally {
      setDownloading(false)
    }
  }

  const printQRCodes = () => {
    if (selectedAssets.size === 0) {
      alert('Selecione pelo menos um ativo para imprimir!')
      return
    }
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const selectedAssetsData = assets.filter(asset => selectedAssets.has(asset.id))
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Impressão</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .qr-item { 
              border: 1px solid #ddd; 
              padding: 15px; 
              text-align: center; 
              page-break-inside: avoid;
            }
            .qr-code { width: 150px; height: 150px; margin: 0 auto; }
            .asset-info { margin-top: 10px; font-size: 12px; }
            .asset-code { font-weight: bold; font-size: 14px; }
            @media print {
              .qr-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <h1>QR Codes - Sistema de Patrimônio</h1>
          <div class="qr-grid">
            ${selectedAssetsData.map(asset => `
              <div class="qr-item">
                <img class="qr-code" src="${process.env.NEXT_PUBLIC_API_URL}/qrcode/asset/${asset.id}" alt="QR Code ${asset.code}">
                <div class="asset-info">
                  <div class="asset-code">${asset.code}</div>
                  <div>${asset.name}</div>
                  <div>${asset.tenant.name}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-700'
      case 'MANUTENCAO': return 'bg-yellow-100 text-yellow-700'
      case 'INATIVO': return 'bg-gray-100 text-gray-700'
      case 'BAIXADO': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando QR codes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <QrCode className="mr-3 h-7 w-7 text-indigo-500" />
            QR Codes
          </h1>
          <p className="text-gray-600 mt-1">Gerencie e baixe QR codes dos ativos</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            <span>{viewMode === 'grid' ? 'Lista' : 'Grade'}</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Ativos</p>
                <p className="text-2xl font-bold">{assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <QrCode className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">QR Codes Disponíveis</p>
                <p className="text-2xl font-bold">{filteredAssets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckSquare className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Selecionados</p>
                <p className="text-2xl font-bold">{selectedAssets.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Download className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Escolas</p>
                <p className="text-2xl font-bold">{schools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, código, marca..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="min-w-48">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as escolas</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.code} - {school.name}</option>
                ))}
              </select>
            </div>

            <div className="min-w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="min-w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {filteredAssets.length} de {assets.length} ativos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Massa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllVisible}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Selecionar Todos ({filteredAssets.length})</span>
              </button>
              
              <button
                onClick={clearSelection}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Square className="h-4 w-4" />
                <span>Limpar Seleção</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={downloadMultipleQRCodes}
                disabled={selectedAssets.size === 0 || downloading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Baixar Selecionados ({selectedAssets.size})</span>
              </button>

              <button
                onClick={printQRCodes}
                disabled={selectedAssets.size === 0}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir ({selectedAssets.size})</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista/Grade de QR Codes */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">QR Codes dos Ativos</h2>
          <p className="text-gray-600">Gerencie códigos QR para identificação patrimonial</p>
        </CardHeader>
        <CardContent>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum ativo encontrado com os filtros aplicados</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className={`border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                    selectedAssets.has(asset.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleAssetSelection(asset.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{asset.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{asset.code}</p>
                    </div>
                    <div className="ml-2">
                      {selectedAssets.has(asset.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/qrcode/asset/${asset.id}/svg`}
                      alt={`QR Code ${asset.code}`}
                      className="w-24 h-24 mx-auto border border-gray-200 rounded"
                    />
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Escola:</strong> {asset.tenant.name}</p>
                    <p><strong>Categoria:</strong> {asset.category}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadQRCode(asset.id, asset.code)
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Baixar</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/asset/${asset.id}`, '_blank')
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50 flex items-center justify-center space-x-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    selectedAssets.has(asset.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => toggleAssetSelection(asset.id)}
                      className="rounded"
                    />
                    
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/qrcode/asset/${asset.id}/svg`}
                      alt={`QR Code ${asset.code}`}
                      className="w-16 h-16 border border-gray-200 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                      
                      <div className="mt-1 grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Código:</span>
                          <span className="ml-1 font-mono">{asset.code}</span>
                        </div>
                        <div>
                          <span className="font-medium">Escola:</span>
                          <span className="ml-1">{asset.tenant.name}</span>
                        </div>
                        <div>
                          <span className="font-medium">Categoria:</span>
                          <span className="ml-1">{asset.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadQRCode(asset.id, asset.code)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Baixar</span>
                      </button>
                      
                      <button
                        onClick={() => window.open(`/asset/${asset.id}`, '_blank')}
                        className="border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}