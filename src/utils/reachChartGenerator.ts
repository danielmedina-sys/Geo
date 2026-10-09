import { ReachMetrics } from '../types';

/**
 * Robust numeric parser for OOH metrics
 * Extracts numeric quantities from inputs like "185,000 impactos / día", "5.5M", "28K", "115.000 veh"
 */
export function parseMetricNumber(val?: string): number {
  if (!val) return 0;
  const str = val.trim().toLowerCase();

  // Match Millions (e.g. "5.5M", "5,5 millones", "5.5 m")
  const mMatch = str.match(/([\d.,]+)\s*(?:m|millon|millones)/i);
  if (mMatch) {
    const num = parseFloat(mMatch[1].replace(/,/g, '.'));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }

  // Match Thousands with 'K' (e.g. "185k", "28 k")
  const kMatch = str.match(/([\d.,]+)\s*k/i);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/,/g, '.'));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }

  // Cleanup strings like "185,000" or "185.000"
  const cleanStr = str.replace(/[^\d.,]/g, '');
  if (!cleanStr) return 0;

  // If matches thousands separator formatting (e.g. 115,000 or 115.000)
  if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?$/.test(cleanStr)) {
    const normalized = cleanStr.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(cleanStr.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number with friendly thousand separators or abbreviations
 */
export function formatMetricNumber(n: number): string {
  if (n >= 1000000) {
    const m = (n / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${m}M`;
  }
  return n.toLocaleString('es-ES');
}

/**
 * Draws rounded rectangle on 2D canvas context
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Generates an ultra-crisp corporate OOH Reach & Audience Analytics Chart
 * Returns a base64 DataURL (image/png) ready for jsPDF and UI preview
 */
export function generateReachChartDataUrl(
  reach?: ReachMetrics,
  width: number = 900,
  height: number = 320
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const s = width / 900;

  // Extract parsed numbers or provide standard defaults if empty
  const dailyImpressions = parseMetricNumber(reach?.dailyImpressions) || 185000;
  const dailyVehicles = parseMetricNumber(reach?.dailyVehicles) || 115000;
  const pedestrianTraffic = parseMetricNumber(reach?.pedestrianTraffic) || 28000;
  const monthlyImpressions = parseMetricNumber(reach?.monthlyImpressions) || (dailyImpressions * 30);

  // 1. Background - Solid Corporate White with subtle border
  ctx.fillStyle = '#ffffff';
  drawRoundRect(ctx, 0, 0, width, height, 12 * s);
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5 * s;
  drawRoundRect(ctx, 0, 0, width, height, 12 * s);
  ctx.stroke();

  // Top Accent Line - Subtle Minimal Red Hairline
  ctx.fillStyle = '#e31b38';
  drawRoundRect(ctx, 0, 0, width, 2.5 * s, 1.5 * s);
  ctx.fill();

  // 2. Header Bar
  const padX = 24 * s;
  const headerY = 28 * s;

  // Red Indicator Dot
  ctx.fillStyle = '#e31b38';
  ctx.beginPath();
  ctx.arc(padX + 4 * s, headerY, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  // Header Title
  ctx.font = `800 ${13 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('ANÁLISIS DE ALCANCE & VOLUMEN DE AUDIENCIA', padX + 16 * s, headerY + 4 * s);

  // Header Subtitle / Target Audience Badge - Dynamically measured to avoid cutting off text
  const fullTargetTag = (reach?.targetAudience || 'MÉTRICAS ESTIMADAS OOH CERTIFICADAS').toUpperCase();
  const maxTagWidth = width - padX - (padX + 16 * s + 380 * s); // Available space on the right
  let tagFontSize = 10 * s;
  ctx.font = `700 ${tagFontSize}px "JetBrains Mono", monospace`;
  let measuredTagW = ctx.measureText(fullTargetTag).width;

  while (measuredTagW > maxTagWidth && tagFontSize > 6.8 * s) {
    tagFontSize -= 0.4 * s;
    ctx.font = `700 ${tagFontSize}px "JetBrains Mono", monospace`;
    measuredTagW = ctx.measureText(fullTargetTag).width;
  }

  let finalTargetTag = fullTargetTag;
  if (measuredTagW > maxTagWidth) {
    while (measuredTagW > maxTagWidth && finalTargetTag.length > 10) {
      finalTargetTag = finalTargetTag.slice(0, -1);
      measuredTagW = ctx.measureText(finalTargetTag + '...').width;
    }
    finalTargetTag += '...';
  }

  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(finalTargetTag, width - padX, headerY + 4 * s);

  // Header Divider
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(padX, 42 * s);
  ctx.lineTo(width - padX, 42 * s);
  ctx.stroke();

  // 3. Layout: Two Synchronized Panes
  // Left: Comparative Bar Chart (Vehicular, Peatonal, Impactos Diarios)
  // Right: Hourly Traffic Peak Curve & Monthly Impact Callout
  const splitX = width * 0.52;
  const contentTop = 56 * s;
  const contentBottom = height - 20 * s;
  const contentH = contentBottom - contentTop;

  // Left Pane: Horizontal Bars
  const leftW = splitX - padX - 20 * s;
  const maxVal = Math.max(dailyImpressions, dailyVehicles, pedestrianTraffic, 1000);

  const barMetrics = [
    {
      label: 'IMPACTOS TOTALES / DÍA',
      rawText: reach?.dailyImpressions || `${formatMetricNumber(dailyImpressions)} / día`,
      val: dailyImpressions,
      color: '#0f172a',
      accentColor: '#e31b38',
      share: Math.min(100, Math.round((dailyImpressions / maxVal) * 100))
    },
    {
      label: 'FLUJO VEHICULAR DIARIO',
      rawText: reach?.dailyVehicles || `${formatMetricNumber(dailyVehicles)} veh/día`,
      val: dailyVehicles,
      color: '#e31b38',
      accentColor: '#fb7185',
      share: Math.min(100, Math.round((dailyVehicles / maxVal) * 100))
    },
    {
      label: 'FLUJO PEATONAL ESTIMADO',
      rawText: reach?.pedestrianTraffic || `${formatMetricNumber(pedestrianTraffic)} peatones/día`,
      val: pedestrianTraffic,
      color: '#0284c7',
      accentColor: '#38bdf8',
      share: Math.min(100, Math.max(12, Math.round((pedestrianTraffic / maxVal) * 100)))
    }
  ];

  const barH = 24 * s;
  const barGap = 20 * s;
  const startBarY = contentTop + 16 * s;

  barMetrics.forEach((item, idx) => {
    const curY = startBarY + idx * (barH + barGap + 14 * s);

    // Label & Value Header with collision prevention
    ctx.font = `700 ${10.5 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, padX, curY);

    const labelW = ctx.measureText(item.label).width;
    let rawTextFont = 11.5 * s;
    ctx.font = `800 ${rawTextFont}px "Plus Jakarta Sans", sans-serif`;
    let rawTextW = ctx.measureText(item.rawText).width;

    while (labelW + rawTextW + 10 * s > leftW && rawTextFont > 8.5 * s) {
      rawTextFont -= 0.5 * s;
      ctx.font = `800 ${rawTextFont}px "Plus Jakarta Sans", sans-serif`;
      rawTextW = ctx.measureText(item.rawText).width;
    }

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    ctx.fillText(item.rawText, padX + leftW, curY);

    // Track Background
    const trackY = curY + 6 * s;
    ctx.fillStyle = '#f1f5f9';
    drawRoundRect(ctx, padX, trackY, leftW, barH, 6 * s);
    ctx.fill();

    // Filled Bar
    const fillW = Math.max(20 * s, (item.val / maxVal) * leftW);
    const grad = ctx.createLinearGradient(padX, 0, padX + fillW, 0);
    grad.addColorStop(0, item.color);
    grad.addColorStop(1, item.accentColor);
    ctx.fillStyle = grad;
    drawRoundRect(ctx, padX, trackY, fillW, barH, 6 * s);
    ctx.fill();

    // Inner Percentage Badge
    ctx.font = `800 ${10 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.share}%`, padX + 8 * s, trackY + 16 * s);
  });

  // Vertical Divider between panels
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(splitX, contentTop);
  ctx.lineTo(splitX, contentBottom);
  ctx.stroke();

  // Right Pane: Hourly Traffic Flow & Monthly Callout
  const rightX = splitX + 24 * s;
  const rightW = width - rightX - padX;

  // Title of Curve
  ctx.font = `700 ${11 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'left';
  ctx.fillText('CURVA DE TRÁFICO POR FRANJA HORARIA (PICO & VALLE)', rightX, contentTop + 10 * s);

  // Big Metric Callout Box: Monthly Impacts
  const calloutW = rightW;
  const calloutH = 46 * s;
  const calloutY = contentTop + 20 * s;

  ctx.fillStyle = '#fff1f2';
  drawRoundRect(ctx, rightX, calloutY, calloutW, calloutH, 8 * s);
  ctx.fill();

  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 1 * s;
  drawRoundRect(ctx, rightX, calloutY, calloutW, calloutH, 8 * s);
  ctx.stroke();

  // Left red bar
  ctx.fillStyle = '#e31b38';
  drawRoundRect(ctx, rightX, calloutY, 3.5 * s, calloutH, 2 * s);
  ctx.fill();

  ctx.font = `700 ${10 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#e31b38';
  ctx.textAlign = 'left';
  ctx.fillText('IMPACTO MENSUAL TOTAL PROYECTADO', rightX + 12 * s, calloutY + 18 * s);

  const monthlyFormatted = reach?.monthlyImpressions
    ? reach.monthlyImpressions
    : `${formatMetricNumber(monthlyImpressions)} impactos / mes`;
  let monthlyFont = 14 * s;
  ctx.font = `800 ${monthlyFont}px "Plus Jakarta Sans", sans-serif`;
  let mWidth = ctx.measureText(monthlyFormatted).width;
  while (mWidth > calloutW - 18 * s && monthlyFont > 9.5 * s) {
    monthlyFont -= 0.5 * s;
    ctx.font = `800 ${monthlyFont}px "Plus Jakarta Sans", sans-serif`;
    mWidth = ctx.measureText(monthlyFormatted).width;
  }
  ctx.fillStyle = '#0f172a';
  ctx.fillText(monthlyFormatted, rightX + 12 * s, calloutY + 36 * s);

  // Hourly Curve Plot
  const chartBoxY = calloutY + calloutH + 16 * s;
  const chartBoxH = contentBottom - chartBoxY - 20 * s;

  // Axis Baseline
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(rightX, chartBoxY + chartBoxH);
  ctx.lineTo(rightX + rightW, chartBoxY + chartBoxH);
  ctx.stroke();

  // Sample normalized curve for OOH traffic (morning peak, midday, evening rush, late night)
  // 6:00, 8:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
  const hourlyPoints = [
    { label: '06h', frac: 0.25 },
    { label: '08h', frac: 0.95 }, // Morning Rush
    { label: '10h', frac: 0.55 },
    { label: '12h', frac: 0.70 }, // Midday
    { label: '14h', frac: 0.60 },
    { label: '16h', frac: 0.75 },
    { label: '18h', frac: 1.00 }, // Evening Rush Peak
    { label: '20h', frac: 0.65 },
    { label: '22h', frac: 0.30 }
  ];

  const stepX = rightW / (hourlyPoints.length - 1);

  // Draw Area Curve
  ctx.beginPath();
  ctx.moveTo(rightX, chartBoxY + chartBoxH);

  hourlyPoints.forEach((pt, i) => {
    const px = rightX + i * stepX;
    const py = chartBoxY + chartBoxH - pt.frac * chartBoxH;
    if (i === 0) {
      ctx.lineTo(px, py);
    } else {
      const prevX = rightX + (i - 1) * stepX;
      const prevY = chartBoxY + chartBoxH - hourlyPoints[i - 1].frac * chartBoxH;
      const cp1X = prevX + (px - prevX) / 2;
      const cp1Y = prevY;
      const cp2X = prevX + (px - prevX) / 2;
      const cp2Y = py;
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, px, py);
    }
  });

  ctx.lineTo(rightX + rightW, chartBoxY + chartBoxH);
  ctx.closePath();

  const areaGrad = ctx.createLinearGradient(0, chartBoxY, 0, chartBoxY + chartBoxH);
  areaGrad.addColorStop(0, 'rgba(227, 27, 56, 0.35)');
  areaGrad.addColorStop(1, 'rgba(227, 27, 56, 0.02)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Draw Line Stroke
  ctx.beginPath();
  hourlyPoints.forEach((pt, i) => {
    const px = rightX + i * stepX;
    const py = chartBoxY + chartBoxH - pt.frac * chartBoxH;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      const prevX = rightX + (i - 1) * stepX;
      const prevY = chartBoxY + chartBoxH - hourlyPoints[i - 1].frac * chartBoxH;
      const cp1X = prevX + (px - prevX) / 2;
      const cp1Y = prevY;
      const cp2X = prevX + (px - prevX) / 2;
      const cp2Y = py;
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, px, py);
    }
  });
  ctx.strokeStyle = '#e31b38';
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  // Draw Dots and Labels
  hourlyPoints.forEach((pt, i) => {
    const px = rightX + i * stepX;
    const py = chartBoxY + chartBoxH - pt.frac * chartBoxH;

    // Peak dots
    if (pt.frac >= 0.9) {
      ctx.fillStyle = '#e31b38';
      ctx.beginPath();
      ctx.arc(px, py, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Time Label
    ctx.font = `600 ${8.5 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(pt.label, px, chartBoxY + chartBoxH + 12 * s);
  });

  return canvas.toDataURL('image/png', 0.95);
}
