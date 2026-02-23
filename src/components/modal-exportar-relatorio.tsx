'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ModalExportarRelatorioProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (fileName: string, format: string) => void;
}

export default function ModalExportarRelatorio({
  isOpen,
  onClose,
  onExport,
}: ModalExportarRelatorioProps) {
  const [fileName, setFileName] = useState('relatorio-itens');
  const [format, setFormat] = useState('pdf');

  if (!isOpen) return null;

  const handleExport = () => {
    if (!fileName.trim()) {
      return;
    }
    onExport(fileName.trim(), format.toUpperCase());
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50"
      data-test="modal-exportar-overlay"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        data-test="modal-exportar-content"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          data-test="modal-exportar-header"
        >
          <h2
            className="text-xl font-semibold text-gray-800"
            data-test="modal-exportar-title"
          >
            Exportar Relatório
          </h2>
          <button
            onClick={onClose}
            className="top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            aria-label="Fechar modal"
            data-test="modal-exportar-close-button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4" data-test="modal-exportar-body">
          {/* Nome do arquivo */}
          <div data-test="filename-field">
            <label
              htmlFor="fileName"
              className="block text-sm font-medium text-gray-700 mb-2"
              data-test="filename-label"
            >
              Nome do arquivo
            </label>
            <Input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Digite o nome do arquivo"
              className="w-full"
              data-test="filename-input"
            />
          </div>

          {/* Formato */}
          <div data-test="format-field">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              data-test="format-label"
            >
              Formato
            </label>
            <div className="space-y-2" data-test="format-options">
              <label
                className="flex items-center space-x-3 cursor-pointer"
                data-test="format-option-pdf"
              >
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                  data-test="format-radio-pdf"
                />
                <span className="text-gray-700">.pdf</span>
              </label>
              <label
                className="flex items-center space-x-3 cursor-pointer"
                data-test="format-option-csv"
              >
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                  data-test="format-radio-csv"
                />
                <span className="text-gray-700">.csv</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-lg"
          data-test="modal-exportar-footer"
        >
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
            data-test="modal-exportar-cancel-button"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!fileName.trim()}
            className={`text-white transition-all ${
              fileName.trim()
                ? 'hover:opacity-90 cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-gray-400'
            }`}
            style={fileName.trim() ? { backgroundColor: '#306FCC' } : {}}
            data-test="modal-exportar-export-button"
          >
            Exportar
          </Button>
        </div>
      </div>
    </div>
  );
}
