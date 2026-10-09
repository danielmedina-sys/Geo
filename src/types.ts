export interface TechnicalSpec {
  id: string;
  label: string;
  value: string;
  category?: string;
  iconName?: 'ruler' | 'cpu' | 'zap' | 'users' | 'compass' | 'shield' | 'calendar' | 'tag' | 'box' | 'signal' | 'layers';
}

export type CanvasLayout = 'executive-hud' | 'lower-third' | 'split-sheet' | 'minimal-overlay' | 'clean-photo';

export type ExportResolution = '1080p' | '2k' | '4k';

export interface ResolutionConfig {
  label: string;
  width: number;
  height: number;
  description: string;
}

export const RESOLUTION_MAP: Record<ExportResolution, ResolutionConfig> = {
  '1080p': {
    label: 'Full HD (1080p)',
    width: 1920,
    height: 1080,
    description: '1920 × 1080 px · Ideal para pantallas y correos'
  },
  '2k': {
    label: '2K QHD (1440p)',
    width: 2560,
    height: 1440,
    description: '2560 × 1440 px · Excelente nitidez y catálogos'
  },
  '4k': {
    label: 'Ultra HD (4K)',
    width: 3840,
    height: 2160,
    description: '3840 × 2160 px · Máxima resolución y formato impreso'
  }
};

export interface ReachMetrics {
  dailyVehicles?: string;
  monthlyVehicles?: string;
  dailyImpressions?: string;
  monthlyImpressions?: string;
  pedestrianTraffic?: string;
  targetAudience?: string;
  dwellTime?: string;
  coverageZone?: string;
  pointsOfInterest?: string;
  graphicUrl?: string;
  graphicName?: string;
  showOnCanvas?: boolean;
  includeChartInPdf?: boolean;
}

export interface ProjectData {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  title: string;
  subtitle?: string;
  code: string;
  address: string;
  googleMapsUrl: string;
  coordinates: string;
  companyName: string;
  logoSrc: string;
  logoName: string;
  showLogo: boolean;
  logoPosition: 'top-left' | 'top-right' | 'bottom-card';
  imageSrc: string;
  imageName: string;
  imageFit: 'cover' | 'contain';
  imageZoom: number; // 1 to 2.5
  imagePanX: number; // -100 to 100
  imagePanY: number; // -100 to 100
  darkScrim: number; // 0 to 80%
  specs: TechnicalSpec[];
  reach?: ReachMetrics;
  layout: CanvasLayout;
  accentColor: string; // hex
  showQrCode: boolean;
  qrPosition: 'bottom-right' | 'top-right' | 'bottom-left' | 'overlay-card';
  autoDownloadOnFinish: boolean;
  exportFormat: 'png' | 'jpeg';
  exportResolution: ExportResolution;
}

export interface CompanyBrandConfig {
  companyName: string;
  logoSrc: string;
  logoName: string;
  showLogo: boolean;
  logoPosition: 'top-left' | 'top-right' | 'bottom-card';
  accentColor?: string;
}
