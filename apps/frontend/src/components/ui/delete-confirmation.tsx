//src/components/ui/delete-confirmation.tsx

'use client'

import { useState } from 'react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType: string
  loading?: boolean
  additionalInfo?: string
}

export function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  loading = false,
  additionalInfo
}: DeleteConfirmationProps) {
  const [confirmationText, setConfirmationText] = useState('')

  const canDelete = confirmationText === itemName

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm()
      handleClose()
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Confirmar Exclusão
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">
                    Atenção: Esta ação não pode ser desfeita!
                  </h3>
                  <p className="text-red-700 text-sm mt-1">
                    Você está prestes a excluir {itemType.toLowerCase()}: <strong>{itemName}</strong>
                  </p>
                  {additionalInfo && (
                    <p className="text-red-600 text-sm mt-2 font-medium">
                      {additionalInfo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar, digite exatamente o nome:
              </label>
              <div className="bg-gray-100 p-3 rounded-lg mb-2">
                <code className="text-sm font-mono text-gray-800">{itemName}</code>
              </div>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={`Digite: ${itemName}`}
                autoComplete="off"
              />
            </div>

            {confirmationText && (
              <div className="text-sm">
                {confirmationText === itemName ? (
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Nome confirmado
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Nome não confere
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canDelete || loading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}