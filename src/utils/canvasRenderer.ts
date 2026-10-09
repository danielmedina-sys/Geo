import QRCode from 'qrcode';
import { ProjectData, RESOLUTION_MAP } from '../types';
import { drawEnfoqueEmblemCanvas } from './logoRenderer';
import { saveFileToDisk } from './downloadHelper';

/**
 * Helper to wrap text cleanly into canvas lines
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Draws rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | number[]
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    const r = typeof radius === 'number' ? radius : radius[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Renders the full 16:9 canvas at target width/height with 100% white theme
 */
export async function renderHighResCanvas(
  project: ProjectData,
  targetWidth?: number,
  targetHeight?: number
): Promise<HTMLCanvasElement> {
  const width = targetWidth || RESOLUTION_MAP[project.exportResolution].width;
  const height = targetHeight || RESOLUTION_MAP[project.exportResolution].height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Scale factor relative to 1920 base
  const s = width / 1920;

  // 1. Draw base background - Pure White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Load and draw main image
  if (project.imageSrc) {
    try {
      const img = await loadImage(project.imageSrc);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;

      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (project.imageFit === 'cover') {
        if (imgAspect > canvasAspect) {
          drawH = height;
          drawW = height * imgAspect;
        } else {
          drawW = width;
          drawH = width / imgAspect;
        }
      } else {
        // contain
        if (imgAspect > canvasAspect) {
          drawW = width;
          drawH = width / imgAspect;
        } else {
          drawH = height;
          drawW = height * imgAspect;
        }
      }

      // Apply zoom & pan
      const zoom = project.imageZoom || 1;
      drawW *= zoom;
      drawH *= zoom;

      const panOffsetX = (project.imagePanX / 100) * (width * 0.3);
      const panOffsetY = (project.imagePanY / 100) * (height * 0.3);
      drawX = (width - drawW) / 2 + panOffsetX;
      drawY = (height - drawH) / 2 + panOffsetY;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.warn('Could not render image onto canvas', e);
      drawFallbackPattern(ctx, width, height, s);
    }
  } else {
    drawFallbackPattern(ctx, width, height, s);
  }

  // 3. User configured Dark Scrim overlay (optional)
  if (project.darkScrim > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${project.darkScrim / 100})`;
    ctx.fillRect(0, 0, width, height);
  }

  // 4. Generate QR code for Google Maps link if active
  let qrImage: HTMLImageElement | null = null;
  if (project.showQrCode && project.googleMapsUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(project.googleMapsUrl, {
        margin: 1,
        width: Math.round(360 * s),
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      qrImage = await loadImage(qrDataUrl);
    } catch (err) {
      console.warn('QR code generation failed', err);
    }
  }

  // 5. Clean Photo Preview Mode - Show ONLY the image without HUD overlay cards
  if (project.layout === 'clean-photo') {
    return canvas;
  }

  // Render Layout Style Overlays (All with White Background Theme)
  switch (project.layout) {
    case 'lower-third':
      renderLowerThirdLayout(ctx, project, width, height, s, qrImage);
      break;
    case 'split-sheet':
      renderSplitSheetLayout(ctx, project, width, height, s, qrImage);
      break;
    case 'minimal-overlay':
      renderMinimalOverlayLayout(ctx, project, width, height, s, qrImage);
      break;
    case 'executive-hud':
    default:
      renderExecutiveHudLayout(ctx, project, width, height, s, qrImage);
      break;
  }

  // Load custom logo image if available
  let customLogoImage: HTMLImageElement | null = null;
  if (project.showLogo !== false && project.logoSrc && (project.logoSrc.startsWith('data:image/') || project.logoSrc.startsWith('http'))) {
    try {
      customLogoImage = await loadImage(project.logoSrc, 2000);
    } catch {
      customLogoImage = null;
    }
  }

  // 6. Header Watermark / Technical Ratio Stamp (Clean White Badge)
  renderTopStamp(ctx, project, width, height, s, customLogoImage);

  return canvas;
}

/**
 * Top subtle technical stamp (Brand mark + Code + Quality badge) - White Theme
 */
function renderTopStamp(
  ctx: CanvasRenderingContext2D,
  project: ProjectData,
  width: number,
  _height: number,
  s: number,
  customLogoImage?: HTMLImageElement | null
) {
  ctx.save();
  const cardY = 24 * s;
  const cardH = 46 * s;
  const leftPad = 48 * s;
  const rightPad = width - 48 * s;

  // Left: Company Logo and Brand Card (White background pill)
  if (project.showLogo !== false) {
    const logoH = 32 * s;
    const logoW = logoH * 1.5;
    const brandText = project.companyName || 'ENFOQUE';
    ctx.font = `800 ${15 * s}px "Plus Jakarta Sans", sans-serif`;
    const brandTextW = ctx.measureText(brandText.toUpperCase()).width;
    const cardW = logoW + brandTextW + 36 * s;

    // White Card Backdrop
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12 * s;
    ctx.shadowOffsetY = 2 * s;
    roundRect(ctx, leftPad, cardY, cardW, cardH, 10 * s);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    // Draw Vector Logo Emblem or Custom Uploaded Logo - centered vertically
    const emblemY = cardY + (cardH - logoH) / 2;
    if (customLogoImage && customLogoImage.complete && customLogoImage.naturalWidth > 0) {
      const imgAspect = customLogoImage.naturalWidth / customLogoImage.naturalHeight;
      let drawLW = logoW;
      let drawLH = logoH;
      if (imgAspect > logoW / logoH) {
        drawLH = logoW / imgAspect;
      } else {
        drawLW = logoH * imgAspect;
      }
      const drawLX = leftPad + 10 * s + (logoW - drawLW) / 2;
      const drawLY = emblemY + (logoH - drawLH) / 2;
      try {
        ctx.drawImage(customLogoImage, drawLX, drawLY, drawLW, drawLH);
      } catch {
        drawEnfoqueEmblemCanvas(ctx, leftPad + 10 * s, emblemY, logoW, logoH);
      }
    } else {
      drawEnfoqueEmblemCanvas(ctx, leftPad + 10 * s, emblemY, logoW, logoH);
    }

    // Brand Text in dark typography
    const textX = leftPad + logoW + 20 * s;
    ctx.font = `800 ${15 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(brandText.toUpperCase(), textX, cardY + 28 * s);

    // Accent underline
    ctx.fillStyle = project.accentColor || '#e31b38';
    ctx.fillRect(textX, cardY + 34 * s, 32 * s, 2.5 * s);
  }

  ctx.restore();
}

/**
 * EXECUTIVE HUD LAYOUT - White Theme
 * Floating frosted white card with specs grid & Google Maps QR card
 */
function renderExecutiveHudLayout(
  ctx: CanvasRenderingContext2D,
  project: ProjectData,
  width: number,
  height: number,
  s: number,
  qrImage: HTMLImageElement | null
) {
  ctx.save();

  // Subtle bottom white gradient fade for enhanced contrast
  const gradient = ctx.createLinearGradient(0, height * 0.45, 0, height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);

  // HUD White Panel Geometry
  const marginX = 56 * s;
  const panelW = width - marginX * 2;
  const contentLeft = marginX + 36 * s;
  const qrSectionWidth = qrImage ? 230 * s : 0;
  const leftColWidth = panelW - qrSectionWidth - 72 * s;

  // Distinctive Ficha Técnica Badge directly above title
  const badgeText = 'FICHA TÉCNICA';
  const codeText = project.code ? `CÓDIGO: ${project.code}` : 'DISPONIBILIDAD INMEDIATA';
  const reachText = (project.reach?.showOnCanvas !== false && (project.reach?.dailyImpressions || project.reach?.dailyVehicles))
    ? (project.reach.dailyImpressions || project.reach.dailyVehicles)
    : null;

  ctx.font = `800 ${12 * s}px "Plus Jakarta Sans", sans-serif`;
  const badgeTextW = ctx.measureText(badgeText).width;
  ctx.font = `700 ${11.5 * s}px "JetBrains Mono", monospace`;
  const codeTextW = ctx.measureText(codeText).width;
  ctx.font = `800 ${11 * s}px "Plus Jakarta Sans", sans-serif`;
  const reachTextW = reachText ? ctx.measureText(` · ${reachText}`).width : 0;
  const pillW = badgeTextW + codeTextW + reachTextW + 36 * s;
  const pillH = 26 * s;
  const badgeTotalH = pillH + 14 * s;

  ctx.font = `800 ${32 * s}px "Plus Jakarta Sans", sans-serif`;
  const titleLines = wrapText(ctx, project.title || 'Ubicación sin título', leftColWidth).slice(0, 2);
  const titleHeight = titleLines.length * 36 * s;
  const subtitleHeight = project.subtitle ? 24 * s : 0;

  // Address lines measured dynamically
  ctx.font = `600 ${16 * s}px "Plus Jakarta Sans", sans-serif`;
  const addrLines = project.address
    ? wrapText(ctx, project.address, leftColWidth - 36 * s).slice(0, 2)
    : [];
  const addressHeight = addrLines.length > 0 ? addrLines.length * 24 * s + (project.coordinates ? 22 * s : 0) : 0;

  // Specs calculation
  const specs = (project.specs || []).slice(0, 6);
  const numRows = Math.ceil(specs.length / 3);
  const specCardH = 68 * s;
  const specRowGap = 12 * s;
  const specsTotalH = numRows > 0 ? (numRows * specCardH + (numRows - 1) * specRowGap) : 0;

  // Dynamic panel sizing with guaranteed padding (ZERO overlaps)
  const topPad = 30 * s;
  const headerToSpecsGap = 20 * s;
  const bottomPad = 28 * s;
  const headerTotalH = badgeTotalH + titleHeight + subtitleHeight + addressHeight;
  const panelH = topPad + headerTotalH + (specsTotalH > 0 ? headerToSpecsGap + specsTotalH : 0) + bottomPad;

  const panelBottom = height - 44 * s;
  const panelY = panelBottom - panelH;

  // Pure White Panel Backdrop with soft shadow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 24 * s;
  ctx.shadowOffsetY = 6 * s;
  roundRect(ctx, marginX, panelY, panelW, panelH, 18 * s);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Enfoque Red Accent Top Bar
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, marginX, panelY, panelW, panelH, 18 * s);
  ctx.clip();
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.fillRect(marginX, panelY, panelW, 5.5 * s);
  ctx.restore();

  let curY = panelY + topPad + 18 * s;

  // Distinctive Badge "FICHA TÉCNICA" placed directly OVER the Title
  const badgePillY = curY;
  ctx.fillStyle = '#fff1f2'; // Soft rose tint
  roundRect(ctx, contentLeft, badgePillY, pillW, pillH, 6 * s);
  ctx.fill();
  ctx.strokeStyle = '#fecdd3';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // Left red indicator dot
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.beginPath();
  ctx.arc(contentLeft + 12 * s, badgePillY + pillH / 2, 3.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // "FICHA TÉCNICA" text
  ctx.font = `800 ${11.5 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, contentLeft + 22 * s, badgePillY + 17.5 * s);

  // Separator dot
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('·', contentLeft + 22 * s + badgeTextW + 5 * s, badgePillY + 17.5 * s);

  // Reference Code in dark graphite mono
  ctx.font = `700 ${11 * s}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#334155';
  ctx.fillText(codeText, contentLeft + 22 * s + badgeTextW + 15 * s, badgePillY + 17.5 * s);

  if (reachText) {
    const codeEnd = contentLeft + 22 * s + badgeTextW + 15 * s + codeTextW;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('·', codeEnd + 6 * s, badgePillY + 17.5 * s);
    ctx.font = `800 ${11 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = project.accentColor || '#e31b38';
    ctx.fillText(reachText, codeEnd + 14 * s, badgePillY + 17.5 * s);
  }

  curY += pillH + 20 * s;

  // Render Title
  ctx.font = `800 ${32 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  for (const line of titleLines) {
    ctx.fillText(line, contentLeft, curY);
    curY += 36 * s;
  }

  // Render Subtitle
  if (project.subtitle) {
    ctx.font = `700 ${16 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = project.accentColor || '#e31b38';
    ctx.fillText(project.subtitle, contentLeft, curY);
    curY += 24 * s;
  }

  // Render Address & GPS without collision
  if (addrLines.length > 0) {
    ctx.fillStyle = '#334155';
    ctx.font = `600 ${16 * s}px "Plus Jakarta Sans", sans-serif`;
    drawMapPin(ctx, contentLeft, curY - 13 * s, 16 * s, project.accentColor || '#e31b38');
    
    addrLines.forEach((al) => {
      ctx.fillText(al, contentLeft + 24 * s, curY);
      curY += 22 * s;
    });

    if (project.coordinates) {
      ctx.font = `600 ${13.5 * s}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`GPS: ${project.coordinates}`, contentLeft + 24 * s, curY);
      curY += 22 * s;
    }
    curY += 4 * s;
  }

  // Render Specs Grid - Starts with clear spacing after address
  if (specs.length > 0) {
    const specsY = curY + 8 * s;
    const cols = Math.min(specs.length, 3);
    const colWidth = (leftColWidth - (cols - 1) * 16 * s) / Math.max(cols, 1);

    specs.forEach((spec, idx) => {
      const colIdx = idx % 3;
      const rowIdx = Math.floor(idx / 3);
      const specX = contentLeft + colIdx * (colWidth + 16 * s);
      const specY = specsY + rowIdx * (specCardH + specRowGap);

      // White Spec card with clean border
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, specX, specY, colWidth, specCardH, 8 * s);
      ctx.fill();
      ctx.lineWidth = 1 * s;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Red left accent indicator
      ctx.fillStyle = project.accentColor || '#e31b38';
      roundRect(ctx, specX, specY + 8 * s, 3.5 * s, specCardH - 16 * s, 2 * s);
      ctx.fill();

      // Spec Label
      ctx.font = `700 ${13 * s}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'left';
      ctx.fillText(spec.label.toUpperCase(), specX + 14 * s, specY + 23 * s);

      // Spec Value
      ctx.font = `800 ${17 * s}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#0f172a';
      const valText = spec.value || '-';
      let truncatedVal = valText;
      while (ctx.measureText(truncatedVal).width > colWidth - 28 * s && truncatedVal.length > 4) {
        truncatedVal = truncatedVal.substring(0, truncatedVal.length - 2) + '…';
      }
      ctx.fillText(truncatedVal, specX + 14 * s, specY + 50 * s);
    });
  }

  // Right Side: Google Maps QR Code Card (Pure White with red accent)
  if (qrImage) {
    const qrCardX = marginX + panelW - 210 * s;
    const qrCardY = panelY + 20 * s;
    const qrCardW = 190 * s;
    const qrCardH = panelH - 40 * s;

    // QR Card backdrop
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 14 * s);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();

    // Draw QR code image
    const qrSize = Math.min(136 * s, qrCardH - 64 * s);
    const qrX = qrCardX + (qrCardW - qrSize) / 2;
    const qrY = qrCardY + 16 * s;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Callout text under QR
    ctx.fillStyle = '#e31b38';
    ctx.font = `800 ${12.5 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('GOOGLE MAPS', qrCardX + qrCardW / 2, qrCardY + qrSize + 30 * s);

    ctx.font = `600 ${10.5 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Escanear para ubicar', qrCardX + qrCardW / 2, qrCardY + qrSize + 46 * s);

    // Verified Pin badge at top of QR card
    ctx.fillStyle = '#e31b38';
    ctx.beginPath();
    ctx.arc(qrCardX + qrCardW / 2, qrCardY + 8 * s, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * LOWER THIRD LAYOUT - White Theme
 */
function renderLowerThirdLayout(
  ctx: CanvasRenderingContext2D,
  project: ProjectData,
  width: number,
  height: number,
  s: number,
  qrImage: HTMLImageElement | null
) {
  ctx.save();

  const barH = 285 * s;
  const barY = height - barH;

  // Solid white background with subtle shadow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 20 * s;
  ctx.fillRect(0, barY, width, barH);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, barY, width, 1 * s);

  // Red accent line
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.fillRect(0, barY, width, 5 * s);

  const padX = 56 * s;
  let textY = barY + 52 * s;

  // Left Zone: Title & Location
  const leftW = qrImage ? width * 0.44 : width * 0.6;
  ctx.font = `800 ${32 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  const titleLines = wrapText(ctx, project.title, leftW);
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, padX, textY);
    textY += 38 * s;
  }

  // Address
  textY += 8 * s;
  drawMapPin(ctx, padX, textY - 14 * s, 17 * s, '#e31b38');
  ctx.font = `600 ${17 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#334155';
  ctx.fillText(project.address || 'Ubicación física', padX + 26 * s, textY);

  if (project.coordinates) {
    textY += 26 * s;
    ctx.font = `600 ${14.5 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(`GPS: ${project.coordinates}`, padX + 26 * s, textY);
  }

  // Middle Zone: Technical Specs
  const specsX = padX + leftW + 36 * s;
  const specsW = qrImage ? width - specsX - 240 * s : width - specsX - padX;
  const specs = project.specs.slice(0, 4);

  specs.forEach((sp, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const itemW = (specsW - 20 * s) / 2;
    const itemX = specsX + col * (itemW + 20 * s);
    const itemY = barY + 40 * s + row * 98 * s;

    ctx.font = `700 ${14 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(sp.label.toUpperCase(), itemX, itemY + 18 * s);

    ctx.font = `800 ${19 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(sp.value, itemX, itemY + 46 * s);
  });

  // Right Zone: QR Code
  if (qrImage) {
    const qrX = width - padX - 160 * s;
    const qrY = barY + 30 * s;
    const qrSize = 150 * s;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 12 * s, qrY - 10 * s, qrSize + 24 * s, qrSize + 48 * s, 10 * s);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    ctx.font = `800 ${12 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#e31b38';
    ctx.textAlign = 'center';
    ctx.fillText('GOOGLE MAPS', qrX + qrSize / 2, qrY + qrSize + 18 * s);

    ctx.font = `600 ${10.5 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Escanear Ubicación', qrX + qrSize / 2, qrY + qrSize + 32 * s);
  }

  ctx.restore();
}

/**
 * SPLIT SHEET LAYOUT - White Theme
 */
function renderSplitSheetLayout(
  ctx: CanvasRenderingContext2D,
  project: ProjectData,
  width: number,
  height: number,
  s: number,
  qrImage: HTMLImageElement | null
) {
  ctx.save();

  const sideW = 560 * s;
  const sideX = width - sideW;

  // Solid white surface
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sideX, 0, sideW, height);

  // Left divider border
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(sideX, 0);
  ctx.lineTo(sideX, height);
  ctx.stroke();

  // Top accent bar
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.fillRect(sideX, 0, sideW, 6 * s);

  const padX = sideX + 44 * s;
  const innerW = sideW - 88 * s;
  let curY = 66 * s;

  // Title
  ctx.font = `800 ${30 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  const titleLines = wrapText(ctx, project.title, innerW);
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, padX, curY);
    curY += 36 * s;
  }

  // Address
  curY += 12 * s;
  drawMapPin(ctx, padX, curY - 14 * s, 17 * s, project.accentColor || '#e31b38');
  ctx.font = `600 ${16.5 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#334155';
  const addrLines = wrapText(ctx, project.address, innerW - 26 * s);
  for (const al of addrLines.slice(0, 2)) {
    ctx.fillText(al, padX + 26 * s, curY);
    curY += 24 * s;
  }

  // Divider
  curY += 16 * s;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(padX, curY, innerW, 1 * s);
  curY += 24 * s;

  // Section Header: Ficha Técnica
  ctx.font = `800 ${15 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = project.accentColor || '#e31b38';
  ctx.fillText('ESPECIFICACIONES TÉCNICAS', padX, curY);
  curY += 26 * s;

  // Specs Rows (White with subtle border)
  project.specs.slice(0, 6).forEach((spec) => {
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, padX, curY, innerW, 52 * s, 7 * s);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    ctx.font = `700 ${13.5 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(spec.label, padX + 16 * s, curY + 32 * s);

    ctx.font = `800 ${16 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    ctx.fillText(spec.value, padX + innerW - 16 * s, curY + 32 * s);

    curY += 60 * s;
  });

  // QR Code Box at bottom of sidebar
  if (qrImage) {
    const qrBoxH = 150 * s;
    const qrBoxY = height - qrBoxH - 44 * s;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, padX, qrBoxY, innerW, qrBoxH, 12 * s);
    ctx.fill();
    ctx.lineWidth = 1 * s;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    const qrSize = 110 * s;
    const qrX = padX + 20 * s;
    const qrY = qrBoxY + (qrBoxH - qrSize) / 2;

    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // QR labels
    const textX = qrX + qrSize + 24 * s;
    ctx.textAlign = 'left';
    ctx.font = `800 ${14 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#e31b38';
    ctx.fillText('GOOGLE MAPS', textX, qrBoxY + 50 * s);

    ctx.font = `600 ${12 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Escanea con tu cámara', textX, qrBoxY + 72 * s);
    ctx.fillText('para ver la ruta en vivo', textX, qrBoxY + 90 * s);
  }

  ctx.restore();
}

/**
 * MINIMAL OVERLAY LAYOUT - White Theme
 */
function renderMinimalOverlayLayout(
  ctx: CanvasRenderingContext2D,
  project: ProjectData,
  width: number,
  height: number,
  s: number,
  qrImage: HTMLImageElement | null
) {
  ctx.save();

  // Bottom left floating badge - Pure White
  const cardX = 56 * s;
  const cardW = 620 * s;
  const cardH = 285 * s;
  const cardY = height - cardH - 56 * s;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 24 * s;
  roundRect(ctx, cardX, cardY, cardW, cardH, 16 * s);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Accent tab
  ctx.fillStyle = project.accentColor || '#e31b38';
  roundRect(ctx, cardX, cardY, 6 * s, cardH, [16 * s, 0, 0, 16 * s]);
  ctx.fill();

  let curY = cardY + 42 * s;
  const innerPad = cardX + 30 * s;

  ctx.font = `800 ${28 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  const tLines = wrapText(ctx, project.title, cardW - 60 * s);
  for (const tl of tLines.slice(0, 2)) {
    ctx.fillText(tl, innerPad, curY);
    curY += 34 * s;
  }

  curY += 8 * s;
  drawMapPin(ctx, innerPad, curY - 14 * s, 16 * s, '#e31b38');
  ctx.font = `600 ${16.5 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#334155';
  ctx.fillText(project.address, innerPad + 24 * s, curY);

  // Specs pill row inside card
  curY += 40 * s;
  const specs = project.specs.slice(0, 3);
  let specOffX = innerPad;
  specs.forEach((sp) => {
    const text = `${sp.label}: ${sp.value}`;
    ctx.font = `700 ${14.5 * s}px "Plus Jakarta Sans", sans-serif`;
    const tw = ctx.measureText(text).width + 28 * s;

    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, specOffX, curY - 18 * s, tw, 36 * s, 7 * s);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.fillText(text, specOffX + 14 * s, curY + 6 * s);
    specOffX += tw + 12 * s;
  });

  // Bottom right floating QR
  if (qrImage) {
    const qrW = 160 * s;
    const qrH = 190 * s;
    const qrX = width - qrW - 56 * s;
    const qrY = height - qrH - 56 * s;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 24 * s;
    roundRect(ctx, qrX, qrY, qrW, qrH, 14 * s);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    const qSize = 124 * s;
    ctx.drawImage(qrImage, qrX + (qrW - qSize) / 2, qrY + 16 * s, qSize, qSize);

    ctx.font = `800 ${11 * s}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#e31b38';
    ctx.textAlign = 'center';
    ctx.fillText('GOOGLE MAPS', qrX + qrW / 2, qrY + qSize + 32 * s);
  }

  ctx.restore();
}

/**
 * Draws crisp SVG-like Google Maps Pin on canvas
 */
function drawMapPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 24;
  ctx.scale(scale, scale);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, 2);
  ctx.bezierCurveTo(7.03, 2, 3, 6.03, 3, 11);
  ctx.bezierCurveTo(3, 16.5, 11, 23, 12, 23.5);
  ctx.bezierCurveTo(13, 23, 21, 16.5, 21, 11);
  ctx.bezierCurveTo(21, 6.03, 16.97, 2, 12, 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(12, 10, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Fallback grid pattern if no image loaded - Clean White Architecture Grid
 */
function drawFallbackPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  s: number
) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
  ctx.lineWidth = 1 * s;

  const gridSize = 60 * s;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Center helper text
  ctx.font = `600 ${22 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('Sube o arrastra una imagen aquí', width / 2, height / 2);
}

/**
 * Image loader helper - Handles CORS safely with timeout protection to prevent hanging
 */
export function loadImage(src: string, timeoutMs: number = 3000): Promise<HTMLImageElement> {
  if (!src) return Promise.reject(new Error('No image source provided'));

  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        if (img.complete && img.naturalWidth > 0) {
          resolve(img);
        } else {
          console.warn('Image load timed out for:', src.slice(0, 80));
          reject(new Error('Image load timeout'));
        }
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        console.warn('Image load error for:', src.slice(0, 80), err);
        reject(new Error('Image failed to load'));
      }
    };

    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      settled = true;
      clearTimeout(timer);
      resolve(img);
    }
  });
}

/**
 * Triggers direct browser download of the canvas blob
 */
export async function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png'
): Promise<{
  sizeBytes: number;
  dataUrl: string;
  blobUrl: string;
  filename: string;
  blob?: Blob;
  serverDownloadUrl?: string;
  serverViewUrl?: string;
}> {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.95 : undefined;

  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL(mimeType, quality);
  } catch (e) {
    console.warn('toDataURL failed', e);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          if (dataUrl) {
            triggerDirectDownload(dataUrl, filename);
            resolve({ sizeBytes: Math.round(dataUrl.length * 0.75), dataUrl, blobUrl: dataUrl, filename });
            return;
          }
          reject(new Error('No se pudo generar la imagen'));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        let serverDownloadUrl: string | undefined;
        let serverViewUrl: string | undefined;

        // Attempt robust save
        try {
          const saveRes = await saveFileToDisk({
            filename,
            blob,
            mimeType
          });
          serverDownloadUrl = saveRes.serverDownloadUrl;
          serverViewUrl = saveRes.serverViewUrl;
        } catch (err) {
          console.warn('saveFileToDisk image error', err);
          triggerDirectDownload(blobUrl, filename);
        }

        resolve({
          sizeBytes: blob.size,
          dataUrl: dataUrl || blobUrl,
          blobUrl,
          filename,
          blob,
          serverDownloadUrl,
          serverViewUrl
        });
      },
      mimeType,
      quality
    );
  });
}

export function triggerDirectDownload(url: string, filename: string) {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);
  } catch (err) {
    console.warn('Direct download click error', err);
  }
}
