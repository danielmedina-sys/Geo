import React from 'react';
import { ProjectData } from '../types';
import {
  Palette,
  Building2
} from 'lucide-react';

interface StyleControlsProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
}

const ACCENT_COLORS = [
  { name: 'Rojo Enfoque', hex: '#e31b38' },
  { name: 'Ámbar Oro', hex: '#f59e0b' },
  { name: 'Azul Eléctrico', hex: '#0284c7' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Antracita Oscuro', hex: '#1e2229' },
  { name: 'Blanco Nieve', hex: '#ffffff' }
];

export const StyleControls: React.FC<StyleControlsProps> = ({
  project,
  onUpdate
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#e31b38]" />
          5. Estilo & Color de Acento
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Personaliza el color de acento y el membrete corporativo de la propuesta.
        </p>
      </div>

      {/* Accent Colors & Company Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Accent Color */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Color de Acento & Destaque
          </label>
          <div className="flex items-center gap-2">
            {ACCENT_COLORS.map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() =>
                  onUpdate((prev) => ({ ...prev, accentColor: col.hex }))
                }
                className={`w-7 h-7 rounded-full border-2 transition-transform shadow-xs cursor-pointer ${
                  project.accentColor === col.hex
                    ? 'scale-110 border-slate-900 ring-2 ring-[#e31b38]/40 shadow-sm'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
          </div>
        </div>

        {/* Company / Agency Brand */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Nombre de Empresa o Membrete</span>
          </label>
          <input
            type="text"
            value={project.companyName}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, companyName: e.target.value }))
            }
            placeholder="Ej: ENFOQUE MEDIOS"
            className="w-full bg-white border border-slate-200 focus:border-[#e31b38] focus:ring-1 focus:ring-[#e31b38] rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-colors shadow-xs font-medium"
          />
        </div>
      </div>
    </div>
  );
};
