import { ProjectData, CompanyBrandConfig } from '../types';
import { SAMPLE_PRESETS } from '../presets';
import { ENFOQUE_LOGO_DATA_URL } from '../assets/enfoqueLogoData';

const DB_NAME = 'geospec_enfoque_db';
const DB_VERSION = 1;
const STORE_NAME = 'units';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('code', 'code', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initializes the database. If empty, seeds with sample Enfoque units.
 */
export async function initializeStorage(): Promise<ProjectData[]> {
  const db = await getDB();
  const all = await getAllUnits();

  if (all.length === 0) {
    const initialUnits: ProjectData[] = [
      {
        id: 'unit-1',
        title: 'Pantalla LED Digital - Distribuidor Altamira',
        subtitle: '',
        code: 'CCS-OUT-084B',
        address: 'Autopista Gran Cacique Guaicaipuro, Distribuidor Altamira, Caracas 1060',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Distribuidor+Altamira+Caracas',
        coordinates: '10.4938° N, 66.8519° W',
        companyName: 'ENFOQUE',
        logoSrc: SAMPLE_PRESETS[0]?.data?.logoSrc || '',
        logoName: 'Logo Enfoque negro.png',
        showLogo: true,
        logoPosition: 'top-left',
        imageSrc: '/src/assets/images/sample_billboard_urban_1790867094382.jpg',
        imageName: 'valla_led_distribuidor_altamira.jpg',
        imageFit: 'cover',
        imageZoom: 1,
        imagePanX: 0,
        imagePanY: 0,
        darkScrim: 25,
        specs: [
          { id: '1', label: 'Dimensiones', value: '14.00 m × 5.00 m (70 m²)', iconName: 'ruler' },
          { id: '2', label: 'Tecnología', value: 'Pantalla SMD LED P6.6 Outdoor Ultra-Bright', iconName: 'cpu' },
          { id: '3', label: 'Flujo Vehicular', value: '115,000 vehículos / día promedio', iconName: 'users' },
          { id: '4', label: 'Iluminación / Brillo', value: '7,500 nits (Sensor Auto-Dimming 24/7)', iconName: 'zap' },
          { id: '5', label: 'Orientación', value: 'Frontal a tráfico Sentido Chacao - Petare', iconName: 'compass' },
          { id: '6', label: 'Disponibilidad', value: 'Slots de 10s · Rotación 6 marcas', iconName: 'calendar' }
        ],
        reach: {
          dailyImpressions: '185,000 impactos / día',
          monthlyImpressions: '5,550,000 impactos / mes',
          dailyVehicles: '115,000 vehículos / día promedio',
          pedestrianTraffic: '28,000 personas / día',
          targetAudience: 'Segmento ABC+ · Ejecutivos, Familias y Comercio',
          coverageZone: 'Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira)',
          dwellTime: '12 - 18 seg promedio (Retención y semáforo)',
          pointsOfInterest: 'C.C. San Ignacio, Torre Cavendes, Hoteles, Plaza Altamira',
          showOnCanvas: true,
          includeChartInPdf: true
        },
        layout: 'clean-photo',
        accentColor: '#e31b38',
        showQrCode: true,
        qrPosition: 'overlay-card',
        autoDownloadOnFinish: false,
        exportFormat: 'png',
        exportResolution: '1080p',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'unit-2',
        title: 'Valla Monoposte - Av. Francisco de Miranda (Chacao)',
        subtitle: '',
        code: 'CCS-OUT-102A',
        address: 'Avenida Francisco de Miranda cruce con Av. Principal de El Bosque, Chacao, Caracas',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+Francisco+de+Miranda+Chacao+Caracas',
        coordinates: '10.4912° N, 66.8624° W',
        companyName: 'ENFOQUE',
        logoSrc: SAMPLE_PRESETS[0]?.data?.logoSrc || '',
        logoName: 'Logo Enfoque negro.png',
        showLogo: true,
        logoPosition: 'top-left',
        imageSrc: '/src/assets/images/sample_commercial_venue_1790867104966.jpg',
        imageName: 'valla_chacao_torre_financiera.jpg',
        imageFit: 'cover',
        imageZoom: 1,
        imagePanX: 0,
        imagePanY: 0,
        darkScrim: 20,
        specs: [
          { id: '1', label: 'Dimensiones', value: '12.00 m × 4.00 m (48 m²)', iconName: 'ruler' },
          { id: '2', label: 'Estructura', value: 'Monoposte Unipolar 18m altura libre', iconName: 'layers' },
          { id: '3', label: 'Iluminación', value: '4 Proyectores LED 400W 5000K', iconName: 'zap' },
          { id: '4', label: 'Impactos Mensuales', value: '1,850,000 visualizaciones estimadas', iconName: 'users' },
          { id: '5', label: 'Material de Impresión', value: 'Lona Frontlit 13oz UV Resistant', iconName: 'box' }
        ],
        reach: {
          dailyImpressions: '95,000 impactos / día',
          monthlyImpressions: '2,850,000 impactos / mes',
          dailyVehicles: '62,000 vehículos / día',
          pedestrianTraffic: '45,000 personas / día (Alto flujo peatonal y Metro)',
          targetAudience: 'Segmento Financiero, Corporativo y Comercial AB/C+',
          coverageZone: 'Corredor Financiero Chacao - El Rosal - Campo Alegre',
          dwellTime: '20 - 35 seg (Semáforos y cruces peatonales)',
          pointsOfInterest: 'Bancos, Torres de Oficinas, Centro Lido, Metro Chacao',
          showOnCanvas: true,
          includeChartInPdf: true
        },
        layout: 'clean-photo',
        accentColor: '#e31b38',
        showQrCode: true,
        qrPosition: 'overlay-card',
        autoDownloadOnFinish: false,
        exportFormat: 'png',
        exportResolution: '1080p',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000
      },
      {
        id: 'unit-3',
        title: 'Totem LED Urbano - Centro Comercial Las Mercedes',
        subtitle: '',
        code: 'CCS-OUT-305C',
        address: 'Calle Madrid con Calle Nueva York, Las Mercedes, Caracas 1080',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Las+Mercedes+Caracas',
        coordinates: '10.4815° N, 66.8610° W',
        companyName: 'ENFOQUE',
        logoSrc: SAMPLE_PRESETS[0]?.data?.logoSrc || '',
        logoName: 'Logo Enfoque negro.png',
        showLogo: true,
        logoPosition: 'top-left',
        imageSrc: '/src/assets/images/sample_billboard_urban_1790867094382.jpg',
        imageName: 'totem_las_mercedes.jpg',
        imageFit: 'cover',
        imageZoom: 1,
        imagePanX: 0,
        imagePanY: 0,
        darkScrim: 25,
        specs: [
          { id: '1', label: 'Dimensiones Pantalla', value: '4.00 m × 8.00 m vertical', iconName: 'ruler' },
          { id: '2', label: 'Resolución Nativa', value: '1080 × 1920 (Full HD Vertical)', iconName: 'cpu' },
          { id: '3', label: 'Tráfico Peatonal', value: 'Alta afluencia fines de semana y noches', iconName: 'users' },
          { id: '4', label: 'Audio Sincronizado', value: 'Opcional para activaciones BTL', iconName: 'zap' }
        ],
        reach: {
          dailyImpressions: '45,000 impactos / día',
          monthlyImpressions: '1,350,000 impactos / mes',
          dailyVehicles: '22,000 vehículos / día',
          pedestrianTraffic: '38,000 peatones / día (Target nocturno y fines de semana)',
          targetAudience: 'Target ABC1 · Consumo de Lujo, Gourmet y Entretenimiento',
          coverageZone: 'Milla de Oro Las Mercedes (Restaurantes, Tiendas, Galerías)',
          dwellTime: '45 - 90 seg (Paseo peatonal y tráfico lento)',
          pointsOfInterest: 'Restaurantes, Hoteles 5 Estrellas, Galerías, Centros Comerciales',
          showOnCanvas: true,
          includeChartInPdf: true
        },
        layout: 'clean-photo',
        accentColor: '#e31b38',
        showQrCode: true,
        qrPosition: 'overlay-card',
        autoDownloadOnFinish: false,
        exportFormat: 'png',
        exportResolution: '1080p',
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 7200000
      }
    ];

    for (const unit of initialUnits) {
      await saveUnit(unit);
    }
    return initialUnits;
  }

  // Ensure stored units have reach initialized if missing
  const updatedUnits: ProjectData[] = [];
  for (const unit of all) {
    if (!unit.reach || Object.keys(unit.reach).length === 0) {
      unit.reach = {
        dailyImpressions: '185,000 impactos / día',
        monthlyImpressions: '5,550,000 impactos / mes',
        dailyVehicles: '115,000 vehículos / día promedio',
        pedestrianTraffic: '28,000 personas / día',
        targetAudience: 'Segmento ABC+ · Ejecutivos, Familias y Comercio',
        coverageZone: 'Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira)',
        dwellTime: '12 - 18 seg promedio (Retención y semáforo)',
        pointsOfInterest: 'C.C. San Ignacio, Torre Cavendes, Hoteles, Plaza Altamira',
        showOnCanvas: true,
        includeChartInPdf: true
      };
      await saveUnit(unit);
    }
    updatedUnits.push(unit);
  }

  return updatedUnits;
}

export async function getAllUnits(): Promise<ProjectData[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const units: ProjectData[] = request.result || [];
      // Sort newest first
      units.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      resolve(units);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getUnitById(id: string): Promise<ProjectData | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUnit(unit: ProjectData): Promise<ProjectData> {
  const db = await getDB();
  const unitWithTimestamps: ProjectData = {
    ...unit,
    id: unit.id || `unit-${Date.now()}`,
    createdAt: unit.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(unitWithTimestamps);

    request.onsuccess = () => resolve(unitWithTimestamps);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUnit(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Exports all stored units as a JSON string for full database backup.
 */
export async function exportAllUnitsJSON(): Promise<string> {
  const all = await getAllUnits();
  return JSON.stringify(all, null, 2);
}

/**
 * Imports units from a JSON string into IndexedDB.
 */
export async function importUnitsJSON(jsonString: string): Promise<ProjectData[]> {
  const parsed = JSON.parse(jsonString);
  const units: ProjectData[] = Array.isArray(parsed) ? parsed : [parsed];
  for (const u of units) {
    if (u && typeof u === 'object') {
      await saveUnit(u);
    }
  }
  return await getAllUnits();
}

const COMPANY_BRANDING_STORAGE_KEY = 'geospec_company_branding_defaults';

export const DEFAULT_COMPANY_BRANDING: CompanyBrandConfig = {
  companyName: 'ENFOQUE',
  logoSrc: ENFOQUE_LOGO_DATA_URL,
  logoName: 'Logo Enfoque negro.png',
  showLogo: true,
  logoPosition: 'top-left',
  accentColor: '#e31b38'
};

/**
 * Retrieves the globally saved company branding defaults, or default Enfoque config.
 */
export function getSavedCompanySettings(): CompanyBrandConfig {
  try {
    const raw = localStorage.getItem(COMPANY_BRANDING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          companyName: parsed.companyName !== undefined ? parsed.companyName : DEFAULT_COMPANY_BRANDING.companyName,
          logoSrc: parsed.logoSrc !== undefined ? parsed.logoSrc : DEFAULT_COMPANY_BRANDING.logoSrc,
          logoName: parsed.logoName !== undefined ? parsed.logoName : DEFAULT_COMPANY_BRANDING.logoName,
          showLogo: parsed.showLogo !== undefined ? Boolean(parsed.showLogo) : DEFAULT_COMPANY_BRANDING.showLogo,
          logoPosition: parsed.logoPosition || DEFAULT_COMPANY_BRANDING.logoPosition,
          accentColor: parsed.accentColor || DEFAULT_COMPANY_BRANDING.accentColor
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load company branding settings from localStorage', err);
  }
  return { ...DEFAULT_COMPANY_BRANDING };
}

/**
 * Persists the company branding defaults in localStorage.
 */
export function saveCompanySettings(settings: CompanyBrandConfig): void {
  try {
    localStorage.setItem(COMPANY_BRANDING_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save company branding settings to localStorage', err);
  }
}

/**
 * Batch updates all stored units in IndexedDB with the specified company branding.
 */
export async function applyCompanyBrandingToAllUnits(branding: CompanyBrandConfig): Promise<ProjectData[]> {
  const all = await getAllUnits();
  const updatedUnits: ProjectData[] = [];

  for (const u of all) {
    const updated: ProjectData = {
      ...u,
      companyName: branding.companyName,
      logoSrc: branding.logoSrc,
      logoName: branding.logoName,
      showLogo: branding.showLogo,
      logoPosition: branding.logoPosition,
      accentColor: branding.accentColor || u.accentColor,
      updatedAt: Date.now()
    };
    await saveUnit(updated);
    updatedUnits.push(updated);
  }

  return updatedUnits;
}

