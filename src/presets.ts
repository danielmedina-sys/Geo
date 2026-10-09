import { ProjectData } from './types';
import { ENFOQUE_LOGO_DATA_URL } from './assets/enfoqueLogoData';

export const SAMPLE_PRESETS: { id: string; name: string; category: string; data: Partial<ProjectData> }[] = [
  {
    id: 'valla-exterior',
    name: 'Valla Publicitaria Premium (Autopista)',
    category: 'Publicidad Exterior',
    data: {
      title: 'Pantalla LED Digital - Distribuidor Altamira',
      subtitle: '',
      code: 'CCS-OUT-084B',
      address: 'Autopista Gran Cacique Guaicaipuro, Distribuidor Altamira, Caracas 1060',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Distribuidor+Altamira+Caracas',
      coordinates: '10.4938° N, 66.8519° W',
      companyName: 'ENFOQUE',
      logoSrc: ENFOQUE_LOGO_DATA_URL,
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
      layout: 'clean-photo',
      accentColor: '#e31b38',
      showQrCode: true,
      qrPosition: 'overlay-card',
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
        dailyVehicles: '115,000 vehículos diarios',
        pedestrianTraffic: '28,000 personas / día',
        targetAudience: 'Segmento ABC+ · Ejecutivos, Familias y Comercio',
        coverageZone: 'Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira)',
        dwellTime: '12 - 18 seg promedio (Retención y semáforo Distribuidor)',
        pointsOfInterest: 'C.C. San Ignacio, Torre Cavendes, Hoteles de Chacao, Plaza Altamira',
        showOnCanvas: true
      }
    }
  },
  {
    id: 'local-comercial',
    name: 'Local Comercial / Sede Corporativa',
    category: 'Bienes Raíces',
    data: {
      title: 'Edificio Corporativo & Local Comercial Las Mercedes',
      subtitle: '',
      code: 'PROP-LM-302',
      address: 'Av. Principal de Las Mercedes con Calle Mucuchíes, Caracas 1080',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Las+Mercedes+Caracas',
      coordinates: '10.4812° N, 66.8624° W',
      companyName: 'PORTAFOLIO INMOBILIARIO PREMIUM',
      imageSrc: '/src/assets/images/sample_commercial_venue_1790867104966.jpg',
      imageName: 'local_comercial_las_mercedes.jpg',
      imageFit: 'cover',
      imageZoom: 1,
      imagePanX: 0,
      imagePanY: 0,
      darkScrim: 20,
      layout: 'clean-photo',
      accentColor: '#38bdf8',
      showQrCode: true,
      qrPosition: 'bottom-right',
      specs: [
        { id: '1', label: 'Área Construida', value: '580 m² (Planta baja + Mezzanina)', iconName: 'box' },
        { id: '2', label: 'Fachada Vidriada', value: '18.5 m lineales frente a avenida', iconName: 'ruler' },
        { id: '3', label: 'Estacionamientos', value: '14 puestos exclusivos en sótano', iconName: 'tag' },
        { id: '4', label: 'Infraestructura', value: 'Planta eléctrica 100% + Pozo de agua', iconName: 'zap' },
        { id: '5', label: 'Altura Libre', value: '4.80 metros a losa vista', iconName: 'ruler' },
        { id: '6', label: 'Estatus', value: 'Disponible para Entrega Inmediata', iconName: 'shield' }
      ]
    }
  }
];

export const SPEC_TEMPLATES_BY_NICHE = {
  billboard: [
    { label: 'Dimensiones', defaultValue: '12.00 m × 4.00 m', iconName: 'ruler' as const },
    { label: 'Tipo de Soporte', defaultValue: 'Monoposte Unipolar 18m altura', iconName: 'box' as const },
    { label: 'Formato', defaultValue: 'Lona Frontlight 13oz / Backlight', iconName: 'tag' as const },
    { label: 'Iluminación', defaultValue: '4 Proyectores LED 150W (6pm a 6am)', iconName: 'zap' as const },
    { label: 'Tráfico Estimado', defaultValue: '85,000 impactos diarios', iconName: 'users' as const },
    { label: 'Visibilidad', defaultValue: 'Despejada a más de 300 metros', iconName: 'compass' as const }
  ],
  realEstate: [
    { label: 'Metraje Total', defaultValue: '350 m²', iconName: 'box' as const },
    { label: 'Zonificación', defaultValue: 'Comercial C-2 / Oficinas', iconName: 'tag' as const },
    { label: 'Puestos de Estacionamiento', defaultValue: '8 puestos asignados', iconName: 'shield' as const },
    { label: 'Servicios', defaultValue: 'Fibra óptica redundante, Agua 24/7', iconName: 'zap' as const },
    { label: 'Niveles', defaultValue: '2 plantas con acceso independiente', iconName: 'ruler' as const },
    { label: 'Condición', defaultValue: 'Excelente estado / Listo para habitar', iconName: 'calendar' as const }
  ],
  logistics: [
    { label: 'Área de Almacén', defaultValue: '1,200 m² techados', iconName: 'box' as const },
    { label: 'Andenes de Carga', defaultValue: '3 muelles con niveladores hidráulicos', iconName: 'tag' as const },
    { label: 'Altura Útil', defaultValue: '9.50 metros libres', iconName: 'ruler' as const },
    { label: 'Piso Industrial', defaultValue: 'Concreto pulido 8 ton/m²', iconName: 'shield' as const },
    { label: 'Sistema Contra Incendios', defaultValue: 'Rociadores automáticos y red siamesa', iconName: 'zap' as const },
    { label: 'Seguridad', defaultValue: 'Circuito cerrado CCTV 24/7 y garita', iconName: 'users' as const }
  ]
};

export const REACH_TEMPLATES = {
  highway: {
    name: 'Autopista Principal (Alto Tráfico)',
    data: {
      dailyImpressions: '185,000 impactos / día',
      monthlyImpressions: '5,550,000 impactos / mes',
      dailyVehicles: '115,000 vehículos / día promedio',
      pedestrianTraffic: '28,000 personas / día',
      targetAudience: 'Segmento ABC+ · Ejecutivos, Familias y Comercio',
      coverageZone: 'Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira)',
      dwellTime: '12 - 18 segundos promedio (Retención y semáforo)',
      pointsOfInterest: 'C.C. San Ignacio, Torre Cavendes, Hoteles, Plaza Altamira',
      showOnCanvas: true
    }
  },
  commercialAvenue: {
    name: 'Avenida Comercial & Financiera',
    data: {
      dailyImpressions: '125,000 impactos / día',
      monthlyImpressions: '3,750,000 impactos / mes',
      dailyVehicles: '72,000 vehículos / día',
      pedestrianTraffic: '45,000 peatones / día (Alto tránsito a pie)',
      targetAudience: 'Público Profesional, Corporativo y Compradores',
      coverageZone: 'Av. Francisco de Miranda · Corredor Financiero Chacao - El Rosal',
      dwellTime: '15 - 25 segundos (Paso peatonal y semáforos)',
      pointsOfInterest: 'Sedes bancarias, Centros empresariales, Restaurantes, Metro',
      showOnCanvas: true
    }
  },
  pedestrianHub: {
    name: 'Centro Urbano / Nodo Peatonal y Metro',
    data: {
      dailyImpressions: '95,000 impactos / día',
      monthlyImpressions: '2,850,000 impactos / mes',
      dailyVehicles: '35,000 vehículos / día',
      pedestrianTraffic: '68,000 peatones / día (Flujo continuo)',
      targetAudience: 'Transeúntes activos, usuarios de transporte, estudiantes y compradores',
      coverageZone: 'Bulevar Sabana Grande / Plaza Venezuela / Estación Metro',
      dwellTime: '20 - 35 segundos (Puntos de encuentro y cruce)',
      pointsOfInterest: 'Estaciones de Metro, bulevares comerciales, teatros, cafés',
      showOnCanvas: true
    }
  },
  interurban: {
    name: 'Vía Interurbana / Acceso Metropolitano',
    data: {
      dailyImpressions: '75,000 impactos / día',
      monthlyImpressions: '2,250,000 impactos / mes',
      dailyVehicles: '58,000 vehículos / día (Tráfico de entrada y salida)',
      pedestrianTraffic: '6,000 personas / día',
      targetAudience: 'Conductores interurbanos, transportistas, turismo y ejecutivos',
      coverageZone: 'Distribuidor La Bandera / Autopista Valle-Coche / Tazón',
      dwellTime: '8 - 12 segundos (Visibilidad frontal abierta a más de 300m)',
      pointsOfInterest: 'Peaje, terminales terrestres, distribuidores viales',
      showOnCanvas: true
    }
  }
};
