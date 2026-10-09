import React from 'react';
import { ProjectData, TechnicalSpec } from '../types';
import {
  Trash2,
  Plus,
  SlidersHorizontal,
  Layers,
  Building2
} from 'lucide-react';

interface TechnicalSpecsFormProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
  onOpenCompanySettings?: () => void;
}

export const TechnicalSpecsForm: React.FC<TechnicalSpecsFormProps> = ({
  project,
  onUpdate,
  onOpenCompanySettings
}) => {
  const handleAddSpec = () => {
    const newSpec: TechnicalSpec = {
      id: Date.now().toString(),
      label: 'Nueva Característica',
      value: 'Detalle o Medida',
      iconName: 'box'
    };
    onUpdate((prev) => ({
      ...prev,
      specs: [...prev.specs, newSpec]
    }));
  };

  const handleUpdateSpec = (id: string, field: 'label' | 'value', val: string) => {
    onUpdate((prev) => ({
      ...prev,
      specs: prev.specs.map((item) =>
        item.id === id ? { ...item, [field]: val } : item
      )
    }));
  };

  const handleRemoveSpec = (id: string) => {
    onUpdate((prev) => ({
      ...prev,
      specs: prev.specs.filter((item) => item.id !== id)
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            3. Especificaciones Técnicas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Agrega o edita las medidas, formato, iluminación, tecnología y soporte.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddSpec}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Añadir Especificación</span>
        </button>
      </div>

      {/* Company & Branding Quick Status */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-slate-600 font-medium">Empresa & Logotipo:</span>
          <span className="font-bold text-slate-900">{project.companyName || 'ENFOQUE'}</span>
          {project.showLogo && project.logoSrc && (
            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">
              Logo activo
            </span>
          )}
        </div>
        {onOpenCompanySettings && (
          <button
            type="button"
            onClick={onOpenCompanySettings}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Configurar Empresa & Logo
          </button>
        )}
      </div>

      {/* Specifications Table / Card List */}
      <div className="flex flex-col gap-2">
        {project.specs.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Layers className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-700 font-semibold">No hay especificaciones añadidas</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Haz clic en "Añadir Especificación" para agregar una característica
            </p>
            <button
              type="button"
              onClick={handleAddSpec}
              className="mt-3 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir primera especificación</span>
            </button>
          </div>
        ) : (
          project.specs.map((spec, index) => (
            <div
              key={spec.id}
              className="group flex items-center gap-2 bg-slate-50/70 hover:bg-slate-100/70 p-2 rounded-xl border border-slate-200/80 transition-colors shadow-2xs"
            >
              <span className="w-5 text-center font-mono text-[11px] text-slate-400 font-medium">
                {index + 1}
              </span>

              {/* Label */}
              <div className="w-1/3">
                <input
                  type="text"
                  value={spec.label}
                  onChange={(e) => handleUpdateSpec(spec.id, 'label', e.target.value)}
                  placeholder="Etiqueta (ej. Dimensiones)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Value */}
              <div className="flex-1">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpec(spec.id, 'value', e.target.value)}
                  placeholder="Valor (ej. 14.00 m × 5.00 m)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-semibold focus:border-slate-800 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveSpec(spec.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar especificación"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        Recomendación: entre 4 y 6 especificaciones técnicas ofrecen el balance estético perfecto en la ficha final.
      </p>
    </div>
  );
};
