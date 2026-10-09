import React from 'react';
import { ProjectData } from '../types';
import {
  MapPin,
  ExternalLink,
  Wand2,
  QrCode,
  Compass,
  Navigation
} from 'lucide-react';

interface LocationDetailsFormProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const LocationDetailsForm: React.FC<LocationDetailsFormProps> = ({
  project,
  onUpdate
}) => {
  // Helper to build a Google Maps URL from physical address
  const handleGenerateMapsUrlFromAddress = () => {
    if (!project.address.trim()) {
      alert('Por favor ingresa primero una dirección en el campo de texto.');
      return;
    }
    const query = encodeURIComponent(project.address.trim());
    const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    onUpdate((prev) => ({
      ...prev,
      googleMapsUrl: generatedUrl
    }));
  };

  // Helper to build a Google Maps URL from GPS Coordinates
  const handleGenerateMapsUrlFromCoords = () => {
    if (!project.coordinates.trim()) {
      alert('Por favor ingresa primero las coordenadas GPS.');
      return;
    }
    const query = encodeURIComponent(project.coordinates.trim());
    const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    onUpdate((prev) => ({
      ...prev,
      googleMapsUrl: generatedUrl
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-700" />
          2. Ubicación & Enlace a Google Maps
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configura la dirección, coordenadas y el enlace compartido de Google Maps para el PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre / Título de la Ubicación
          </label>
          <input
            type="text"
            value={project.title}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Ej: Pantalla LED Digital - Distribuidor Altamira"
            className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-colors shadow-2xs"
          />
        </div>

        {/* Reference Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Código / ID de Sitio (Opcional)
          </label>
          <input
            type="text"
            value={project.code}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="Ej: CCS-OUT-084B"
            className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono transition-colors shadow-2xs"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Dirección Física Completa</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateMapsUrlFromAddress}
              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Crear enlace de Google Maps a partir de este texto"
            >
              <Wand2 className="w-3 h-3 text-slate-400" />
              <span>Generar link de Maps desde dirección</span>
            </button>
          </div>
          <input
            type="text"
            value={project.address}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Ej: Autopista Gran Cacique Guaicaipuro, Distribuidor Altamira, Caracas"
            className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-colors shadow-2xs"
          />
        </div>

        {/* Google Maps URL */}
        <div className="md:col-span-2 bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-slate-500" />
              <span>Enlace Directo a Google Maps</span>
            </label>

            {project.googleMapsUrl && (
              <a
                href={project.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>Probar link en Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={project.googleMapsUrl}
              onChange={(e) =>
                onUpdate((prev) => ({ ...prev, googleMapsUrl: e.target.value }))
              }
              placeholder="https://maps.app.goo.gl/... o https://www.google.com/maps/search/?api=1&query=..."
              className="flex-1 bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono transition-colors shadow-2xs"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Puedes pegar cualquier enlace de Google Maps (maps.app.goo.gl) o coordenadas exactas.
          </p>
        </div>

        {/* Coordinates GPS */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              <span>Coordenadas GPS (Opcional)</span>
            </label>
            {project.coordinates && (
              <button
                type="button"
                onClick={handleGenerateMapsUrlFromCoords}
                className="text-[10px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                Usar en link
              </button>
            )}
          </div>
          <input
            type="text"
            value={project.coordinates}
            onChange={(e) =>
              onUpdate((prev) => ({ ...prev, coordinates: e.target.value }))
            }
            placeholder="Ej: 10.4938° N, 66.8519° W"
            className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-mono transition-colors shadow-2xs"
          />
        </div>

        {/* QR Code Scannable Settings */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Código QR Escaneable en la Ficha
              </p>
              <p className="text-[11px] text-slate-500">
                Permite a los clientes escanear la ficha con su teléfono para abrir la ruta en Maps
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={project.showQrCode}
              onChange={(e) =>
                onUpdate((prev) => ({ ...prev, showQrCode: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
