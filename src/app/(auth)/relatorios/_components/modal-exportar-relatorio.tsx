'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalShell } from '@/components/ui/modal-shell';

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
  const [fileName, setFileName] = useState('relatorio');
  const [format, setFormat] = useState('pdf');

  const handleExport = () => {
    if (!fileName.trim()) {
      return;
    }
    onExport(fileName.trim(), format.toUpperCase());
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="z-50"
      data-test="modal-exportar-overlay"
      contentClassName="shadow-none max-w-lg"
      contentDataTest="modal-exportar-content"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 border-b border-border"
        data-test="modal-exportar-header"
      >
        <h2
          className="text-xl font-semibold text-foreground"
          data-test="modal-exportar-title"
        >
          Exportar Relatório
        </h2>
        <button
          onClick={onClose}
          className="top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
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
            className="block text-sm font-medium text-foreground mb-2"
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
            className="w-full h-11"
            data-test="filename-input"
          />
        </div>

        {/* Formato */}
        <div data-test="format-field">
          <label
            className="block text-sm font-medium text-foreground mb-2"
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
                className="w-4 h-4 text-[var(--ei-accent)] cursor-pointer"
                data-test="format-radio-pdf"
              />
              <span className="text-foreground">.pdf</span>
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
                className="w-4 h-4 text-[var(--ei-accent)] cursor-pointer"
                data-test="format-radio-csv"
              />
              <span className="text-foreground">.csv</span>
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20 rounded-b-md"
        data-test="modal-exportar-footer"
      >
        <Button
          variant="outline"
          onClick={onClose}
          className="h-11 cursor-pointer"
          data-test="modal-exportar-cancel-button"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          disabled={!fileName.trim()}
          className={`h-11 transition-all ${
            fileName.trim()
              ? 'text-ei-accent-foreground hover:opacity-90 cursor-pointer'
              : 'text-muted-foreground opacity-50 cursor-not-allowed bg-muted'
          }`}
          style={fileName.trim() ? { backgroundColor: 'var(--ei-accent)' } : {}}
          data-test="modal-exportar-export-button"
        >
          Exportar
        </Button>
      </div>
    </ModalShell>
  );
}
