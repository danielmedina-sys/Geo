import React, { useRef, useState } from 'react';
import { ProjectData } from '../types';
import {
  Upload,
  Image as ImageIcon,
  Clipboard,
  Sliders,
  RotateCcw,
  Check
} from 'lucide-react';

interface ImageUploaderProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  project,
  onUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpdate((prev) => ({
        ...prev,
        imageSrc: result,
        imageName: file.name,
        imageZoom: 1,
        imagePanX: 0,
        imagePanY: 0
      }));
      setFeedback(`Imagen "${file.name}" cargada con éxito`);
      setTimeout(() => setFeedback(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'captura-portapapeles.png', { type: imageType });
          processFile(file);
          return;
        }
      }
      alert('No se encontró ninguna imagen en el portapapeles. Copia una imagen primero.');
    } catch {
      alert('Para pegar imágenes, usa Ctrl+V o concede permisos de portapapeles.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-700" />
            1. Fotografía de la Ubicación
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sube la fotografía del punto publicitario o pega una captura desde el portapapeles.
          </p>
        </div>

        {feedback && (
          <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            {feedback}
          </span>
        )}
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
          isDragging
            ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-600 transition-transform">
          <Upload className="w-4 h-4 text-slate-700" />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-800">
            Haz clic para buscar imagen o arrástrala aquí
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            JPG, PNG, WebP · Proporción panorámica 16:9 recomendada
          </p>
        </div>

        {project.imageName && (
          <div className="mt-1 text-[11px] font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 truncate max-w-xs font-medium">
            {project.imageName}
          </div>
        )}
      </div>

      {/* Extra Action: Paste from Clipboard */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={handlePasteClipboard}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <Clipboard className="w-3.5 h-3.5 text-slate-500" />
          <span>Pegar imagen copiada del portapapeles</span>
        </button>

        {(project.imagePanX !== 0 || project.imagePanY !== 0 || project.imageZoom !== 1) && (
          <button
            type="button"
            onClick={() =>
              onUpdate((prev) => ({
                ...prev,
                imageZoom: 1,
                imagePanX: 0,
                imagePanY: 0
              }))
            }
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer encuadre</span>
          </button>
        )}
      </div>

      {/* Detailed Positioning / Pan Sliders */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-800 font-semibold pb-1.5 border-b border-slate-200">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#e31b38]" />
            Alineación & Posición en el marco
          </span>
          <span className="text-slate-500 text-[11px] font-normal">Desplazamiento X / Y</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Posición Horizontal (Pan X)</span>
              <span className="font-mono font-semibold text-slate-800">{project.imagePanX}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={project.imagePanX}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  imagePanX: parseInt(e.target.value, 10)
                }))
              }
              className="w-full accent-[#e31b38] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1">
              <span>Posición Vertical (Pan Y)</span>
              <span className="font-mono font-semibold text-slate-800">{project.imagePanY}%</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={project.imagePanY}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  imagePanY: parseInt(e.target.value, 10)
                }))
              }
              className="w-full accent-[#e31b38] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
