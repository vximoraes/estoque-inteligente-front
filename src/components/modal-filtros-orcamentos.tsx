import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalFiltrosOrcamentosProps {
  isOpen: boolean;
  onClose: () => void;
  valorMinFilter: string;
  valorMaxFilter: string;
  dataInicioFilter: string;
  dataFimFilter: string;
  onFiltersChange: (valorMin: string, valorMax: string, dataInicio: string, dataFim: string) => void;
}

const periodoOptions = [
  { value: '', label: 'Todos os períodos' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Última semana' },
  { value: 'mes', label: 'Último mês' },
  { value: 'trimestre', label: 'Últimos 3 meses' },
  { value: 'semestre', label: 'Últimos 6 meses' },
  { value: 'ano', label: 'Último ano' },
  { value: 'personalizado', label: 'Período personalizado' }
];

export default function ModalFiltrosOrcamentos({
  isOpen,
  onClose,
  valorMinFilter,
  valorMaxFilter,
  dataInicioFilter,
  dataFimFilter,
  onFiltersChange
}: ModalFiltrosOrcamentosProps) {
  const [valorMin, setValorMin] = useState(valorMinFilter);
  const [valorMax, setValorMax] = useState(valorMaxFilter);
  const [dataInicio, setDataInicio] = useState(dataInicioFilter);
  const [dataFim, setDataFim] = useState(dataFimFilter);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('');
  const [periodoDropdownOpen, setPeriodoDropdownOpen] = useState(false);
  const [mostrarDatasPersonalizadas, setMostrarDatasPersonalizadas] = useState(false);

  useEffect(() => {
    setValorMin(valorMinFilter);
    setValorMax(valorMaxFilter);
    setDataInicio(dataInicioFilter);
    setDataFim(dataFimFilter);
    
    // Sincronizar o período selecionado baseado nas datas
    // Se não há datas, resetar o período selecionado
    if (!dataInicioFilter && !dataFimFilter) {
      setPeriodoSelecionado('');
      setMostrarDatasPersonalizadas(false);
    } else {
      // Se há datas definidas, verificar se corresponde a algum período predefinido
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];
      
      if (dataInicioFilter === hojeStr && dataFimFilter === hojeStr) {
        setPeriodoSelecionado('hoje');
      } else {
        // Se as datas não correspondem a "hoje", assumir que é personalizado
        setPeriodoSelecionado('personalizado');
        setMostrarDatasPersonalizadas(true);
      }
    }
  }, [valorMinFilter, valorMaxFilter, dataInicioFilter, dataFimFilter]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setPeriodoDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const calcularDatasPeriodo = (periodo: string) => {
    const hoje = new Date();
    let inicio = new Date();
    
    switch (periodo) {
      case 'hoje':
        inicio = new Date(hoje);
        break;
      case 'semana':
        inicio.setDate(hoje.getDate() - 7);
        break;
      case 'mes':
        inicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'trimestre':
        inicio.setMonth(hoje.getMonth() - 3);
        break;
      case 'semestre':
        inicio.setMonth(hoje.getMonth() - 6);
        break;
      case 'ano':
        inicio.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        return { inicio: '', fim: '' };
    }

    // Usar formato local (YYYY-MM-DD) em vez de UTC
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      inicio: formatLocalDate(inicio),
      fim: formatLocalDate(hoje)
    };
  };

  const handlePeriodoChange = (periodo: string) => {
    setPeriodoSelecionado(periodo);
    setPeriodoDropdownOpen(false);

    if (periodo === 'personalizado') {
      setMostrarDatasPersonalizadas(true);
      setDataInicio('');
      setDataFim('');
    } else if (periodo === '') {
      setMostrarDatasPersonalizadas(false);
      setDataInicio('');
      setDataFim('');
    } else {
      setMostrarDatasPersonalizadas(false);
      const datas = calcularDatasPeriodo(periodo);
      setDataInicio(datas.inicio);
      setDataFim(datas.fim);
    }
  };

  const handleApplyFilters = () => {
    const hoje = getDataMaxima(); // Data atual no formato YYYY-MM-DD
    
    // Função para ajustar data futura para hoje
    const ajustarDataFutura = (data: string) => {
      if (!data) return data;
      return data > hoje ? hoje : data;
    };
    
    // Se há um período predefinido selecionado (não personalizado), recalcular as datas
    if (periodoSelecionado && periodoSelecionado !== 'personalizado' && periodoSelecionado !== '') {
      const datas = calcularDatasPeriodo(periodoSelecionado);
      onFiltersChange(valorMin, valorMax, datas.inicio, datas.fim);
    } else {
      // Ajustar datas futuras para a data atual
      let dataInicioAjustada = ajustarDataFutura(dataInicio);
      let dataFimAjustada = ajustarDataFutura(dataFim);
      
      // Se ambas as datas estão preenchidas e a data final é menor que a inicial,
      // ajustar a data final para ser igual à data inicial
      if (dataInicioAjustada && dataFimAjustada && dataFimAjustada < dataInicioAjustada) {
        dataFimAjustada = dataInicioAjustada;
      }
      
      onFiltersChange(valorMin, valorMax, dataInicioAjustada, dataFimAjustada);
    }
    handleCloseModal();
  };

  const handleClearFilters = () => {
    setValorMin('');
    setValorMax('');
    setDataInicio('');
    setDataFim('');
    setPeriodoSelecionado('');
    setMostrarDatasPersonalizadas(false);
    onFiltersChange('', '', '', '');
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setPeriodoDropdownOpen(false);
    onClose();
  };

  const formatarValorMoeda = (valor: string) => {
    // Remove tudo exceto números e vírgula/ponto
    let valorLimpo = valor.replace(/[^\d,.]/g, '');
    
    // Substitui vírgula por ponto para consistência
    valorLimpo = valorLimpo.replace(',', '.');
    
    return valorLimpo;
  };

  const handleValorMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = formatarValorMoeda(e.target.value);
    setValorMin(valor);
  };

  const handleValorMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = formatarValorMoeda(e.target.value);
    setValorMax(valor);
  };

  const getPeriodoLabel = () => {
    const selected = periodoOptions.find(opt => opt.value === periodoSelecionado);
    return selected?.label || 'Todos os períodos';
  };

  // Retorna data atual no formato YYYY-MM-DD (usado para ajustar datas futuras)
  const getDataMaxima = () => {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const modalContent = (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={handleBackdropClick}
      data-test="modal-filtros-orcamentos-backdrop"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-visible animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        data-test="modal-filtros-orcamentos-content"
      >
        {/* Botão de fechar */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            title="Fechar"
            data-test="modal-filtros-orcamentos-close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo dos Filtros */}
        <div className="px-6 pb-6 space-y-6">
          {/* Filtro por Valor */}
          <div className="space-y-2 pt-4" data-test="filtro-valor-container">
            <label className="block text-base font-medium text-gray-700">
              Faixa de valor
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="valorMin" className="block text-sm text-gray-600 mb-1">
                  Valor mínimo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    id="valorMin"
                    type="text"
                    value={valorMin}
                    onChange={handleValorMinChange}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-test="filtro-valor-min-input"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="valorMax" className="block text-sm text-gray-600 mb-1">
                  Valor máximo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    id="valorMax"
                    type="text"
                    value={valorMax}
                    onChange={handleValorMaxChange}
                    placeholder="0,00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-test="filtro-valor-max-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filtro por Período */}
          <div className="space-y-2" data-test="filtro-periodo-container">
            <label className="block text-base font-medium text-gray-700">
              Período
            </label>
            <div className="relative" data-dropdown>
              <button
                onClick={() => setPeriodoDropdownOpen(!periodoDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
                data-test="filtro-periodo-dropdown"
              >
                <span className={periodoSelecionado ? 'text-gray-900' : 'text-gray-500'}>
                  {getPeriodoLabel()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${periodoDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {periodoDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {periodoOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePeriodoChange(option.value)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        periodoSelecionado === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                      } cursor-pointer`}
                      data-test={`filtro-periodo-option-${option.value || 'todos'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Datas personalizadas */}
          {(mostrarDatasPersonalizadas || periodoSelecionado === 'personalizado') && (
            <div className="space-y-2" data-test="filtro-datas-personalizadas-container">
              <label className="block text-base font-medium text-gray-700">
                Selecione o período
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dataInicio" className="block text-sm text-gray-600 mb-1">
                    Data inicial
                  </label>
                  <input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-test="filtro-data-inicio-input"
                  />
                </div>
                <div>
                  <label htmlFor="dataFim" className="block text-sm text-gray-600 mb-1">
                    Data final
                  </label>
                  <input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-test="filtro-data-fim-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1 cursor-pointer"
              data-test="limpar-filtros-button"
            >
              Limpar Filtros
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 text-white hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#306FCC' }}
              data-test="aplicar-filtros-button"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
