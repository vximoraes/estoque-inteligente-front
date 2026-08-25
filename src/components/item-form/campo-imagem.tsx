'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CampoImagemProps {
  previewUrl: string | null;
  onChange: (arquivo: File, previewUrl: string) => void;
  onRemover: () => void;
}

// Área de drag&drop + preview + input escondido. Extraído de
// `modal-cadastrar-item.tsx`, reaproveitado pelo cadastro de consumo, de
// patrimônio e (futuramente) pela edição.
export default function CampoImagem({
  previewUrl,
  onChange,
  onRemover,
}: CampoImagemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lerArquivo = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) lerArquivo(file);
  };

  const handleRemoveImage = () => {
    onRemover();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      lerArquivo(file);
    }
  };

  return (
    <div>
      <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
        Imagem
      </Label>
      {previewUrl ? (
        <div className="relative border-2 border-dashed border-border rounded-md min-h-11 flex items-center px-2 sm:px-3 bg-muted">
          <div className="flex items-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-6 w-6 sm:h-8 sm:w-8 object-cover rounded-md"
              />
              <span className="text-xs sm:text-sm text-foreground truncate">
                Imagem selecionada
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="shrink-0 flex items-center justify-center cursor-pointer"
              aria-label="Remover imagem"
              data-test="botao-remover-imagem"
            >
              <X className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-md min-h-11 flex items-center justify-center px-3 sm:px-4 transition-all cursor-pointer ${
            isDragging
              ? 'border-[var(--ei-accent)] bg-[var(--ei-accent)]/10'
              : 'border-border bg-muted/40 hover:bg-muted hover:border-foreground/30'
          }`}
        >
          <p className="text-center text-xs sm:text-sm">
            <span className="font-semibold text-[var(--ei-accent)]">
              Adicione ou arraste
            </span>{' '}
            <span className="text-muted-foreground"> sua imagem aqui.</span>
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        name="file"
      />
    </div>
  );
}
