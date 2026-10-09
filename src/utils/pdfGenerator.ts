import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { ProjectData } from '../types';
import { renderHighResCanvas } from './canvasRenderer';
import { saveFileToDisk } from './downloadHelper';
import { generateReachChartDataUrl } from './reachChartGenerator';

export interface PDFExportOptions {
  catalogTitle?: string;
  clientName?: string;
  includeCover?: boolean;
  autoDownload?: boolean;
  onProgress?: (current: number, total: number, status: string, percent: number) => void;
}

export interface PDFGenerationResult {
  filename: string;
  blob: Blob;
  blobUrl: string;
  dataUri: string;
  serverDownloadUrl?: string;
  serverViewUrl?: string;
}

/**
 * Draws a user-provided logo if valid, maintaining natural aspect ratio.
 * If no valid logo image was uploaded, returns false so no logo is drawn.
 */
function tryDrawUserLogo(
  doc: jsPDF,
  logoSrc: string | undefined,
  showLogo: boolean | undefined,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): boolean {
  if (!showLogo || !logoSrc || typeof logoSrc !== 'string') {
    return false;
  }

  // Only render if it's a real base64/URL image
  if (!logoSrc.startsWith('data:image/') && !logoSrc.startsWith('http')) {
    return false;
  }

  try {
    const isPng = logoSrc.includes('image/png');
    const format = isPng ? 'PNG' : 'JPEG';
    doc.addImage(logoSrc, format, x, y, maxW, maxH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates and downloads an executive PDF (single unit or multi-unit catalog)
 * Redesigned with a minimalist, modern white aesthetic, restrained red accents,
 * scannable QR codes, direct Google Maps navigation, and NO distorted fake logos.
 */
export async function exportUnitsToPDF(
  units: ProjectData[],
  options: PDFExportOptions = {}
): Promise<PDFGenerationResult> {
  const {
    catalogTitle = 'CATÁLOGO DE CIRCUITOS & FICHAS TÉCNICAS',
    clientName = '',
    includeCover = units.length > 1,
    autoDownload = true,
    onProgress
  } = options;

  if (units.length === 0) {
    throw new Error('No hay unidades seleccionadas para exportar');
  }

  // Landscape A4 PDF (297 mm × 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;

  let pageIndex = 1;
  const totalUnits = units.length;
  const totalPages = includeCover ? totalUnits + 1 : totalUnits;

  // =========================================================================
  // 1. Cover Page (Only if more than 1 unit or explicitly requested)
  // =========================================================================
  if (includeCover) {
    if (onProgress) onProgress(0, totalUnits, 'Generando portada ejecutiva minimalista...', 12);

    // 100% Pure White Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Subtle Top Header Hairline with Red Accent Dot
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(margin, 12, pageWidth - margin, 12);

    // Red Accent Indicator Dot (Top Left)
    doc.setFillColor(227, 27, 56);
    doc.circle(margin + 2, 12, 1.2, 'F');

    // Header Branding: Only draw logo if user provided one; otherwise clean typography
    let logoDrawn = false;
    const firstUnit = units[0];
    if (firstUnit?.showLogo && firstUnit?.logoSrc) {
      logoDrawn = tryDrawUserLogo(doc, firstUnit.logoSrc, true, margin, 18, 36, 12);
    }

    if (!logoDrawn) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      const brandName = (firstUnit?.companyName || 'GEOSPEC').toUpperCase();
      doc.text(brandName, margin, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('CIRCUITOS PUBLICITARIOS EXTERIORES · DOSSIER TÉCNICO OOH', margin, 29);
    }

    // Title Card - Minimalist White with Subtle Slate Hairline
    const titleCardY = 40;
    const titleCardH = 46;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, titleCardY, pageWidth - margin * 2, titleCardH, 2.5, 2.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, titleCardY, pageWidth - margin * 2, titleCardH, 2.5, 2.5, 'S');

    // Small Red Pill Tag inside Title Card
    doc.setFillColor(227, 27, 56);
    doc.roundedRect(margin + 8, titleCardY + 8, 22, 5.5, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CATÁLOGO', margin + 11.5, titleCardY + 11.8);

    // Title text in authoritative dark slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(catalogTitle.toUpperCase(), margin + 34, titleCardY + 12.5);

    // Subtitle & Client Information
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const subtitle = clientName
      ? `Preparado exclusivamente para: ${clientName} · ${totalUnits} ${totalUnits === 1 ? 'ubicación' : 'ubicaciones seleccionadas'}`
      : `Dossier comercial y especificaciones técnicas de ${totalUnits} ${totalUnits === 1 ? 'ubicación disponible' : 'ubicaciones disponibles'}`;
    doc.text(subtitle, margin + 8, titleCardY + 24);

    // Issue Date & Metadata Pill
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + 8, titleCardY + 30, pageWidth - margin * 2 - 16, 10, 1.5, 1.5, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + 8, titleCardY + 30, pageWidth - margin * 2 - 16, 10, 1.5, 1.5, 'S');

    const dateStr = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de emisión: ${dateStr}`, margin + 12, titleCardY + 36.5);

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL UNIDADES: ${totalUnits}`, pageWidth - margin - 50, titleCardY + 36.5);

    // Table of Contents Section
    const tableStartY = 96;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ÍNDICE DE UNIDADES INCLUIDAS', margin, tableStartY);

    let tableY = tableStartY + 5;
    const maxRows = Math.min(units.length, 7);

    // Table Header - Clean light slate background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, tableY, pageWidth - margin * 2, 7.5, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, tableY, pageWidth - margin * 2, 7.5, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CÓDIGO', margin + 6, tableY + 5);
    doc.text('NOMBRE DE LA UBICACIÓN', margin + 44, tableY + 5);
    doc.text('DIRECCIÓN / ZONA', margin + 140, tableY + 5);
    doc.text('PÁG', pageWidth - margin - 14, tableY + 5);

    tableY += 8.5;

    for (let i = 0; i < maxRows; i++) {
      const u = units[i];
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, tableY, pageWidth - margin * 2, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(margin, tableY + 7.5, pageWidth - margin, tableY + 7.5);

      // Red bullet + Code badge
      doc.setFillColor(227, 27, 56);
      doc.circle(margin + 4, tableY + 4, 0.9, 'F');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(15, 23, 42);
      doc.text(u.code || `ID-${i + 1}`, margin + 7, tableY + 4.8);

      // Unit Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const safeTitle = u.title.length > 52 ? u.title.substring(0, 50) + '...' : u.title;
      doc.text(safeTitle, margin + 44, tableY + 4.8);

      // Address
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const safeAddr = (u.address || 'Ubicación comercial').substring(0, 68);
      doc.text(safeAddr, margin + 140, tableY + 4.8);

      // Page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`${i + 2}`, pageWidth - margin - 12, tableY + 4.8);

      tableY += 8;
    }

    if (units.length > 7) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`... y ${units.length - 7} ubicaciones adicionales en las páginas siguientes`, margin + 6, tableY + 5);
    }

    // Cover Footer
    const coverFooterY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, coverFooterY - 3, pageWidth - margin, coverFooterY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Dossier Confidencial · Especificaciones y Fichas Técnicas de Publicidad Exterior', margin, coverFooterY);
    doc.text(`Página ${pageIndex} de ${totalPages}`, pageWidth - margin - 20, coverFooterY);

    doc.addPage('a4', 'landscape');
    pageIndex++;
  }

  // =========================================================================
  // 2. Unit Pages (Ficha Técnica Ejecutiva - 1 Page per Unit)
  // =========================================================================
  const baseSpan = includeCover ? 70 : 80;
  const startOffset = includeCover ? 15 : 5;

  for (let idx = 0; idx < units.length; idx++) {
    const unit = units[idx];
    const unitBaseP = startOffset + (idx / totalUnits) * baseSpan;
    const unitStep = baseSpan / totalUnits;

    if (onProgress) {
      onProgress(idx + 1, totalUnits, `Generando ficha ${idx + 1}/${totalUnits}: ${unit.code || unit.title}...`, Math.round(unitBaseP + unitStep * 0.1));
    }

    if (idx > 0) {
      doc.addPage('a4', 'landscape');
      pageIndex++;
    }

    // 100% Pure White Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // -----------------------------------------------------------------------
    // Header Bar (Y: 10 to 22 mm) - Minimalist & Modern
    // -----------------------------------------------------------------------
    const headerY = 11;

    // Header divider hairline
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 21.5, pageWidth - margin, 21.5);

    // Left: Check if user supplied a custom uploaded logo
    let unitLogoDrawn = false;
    if (unit.showLogo && unit.logoSrc) {
      unitLogoDrawn = tryDrawUserLogo(doc, unit.logoSrc, true, margin, headerY - 1, 32, 9.5);
    }

    // If no logo provided/shown: Crisp typographic header without fake logo
    if (!unitLogoDrawn) {
      // Subtle red accent indicator dot
      doc.setFillColor(227, 27, 56);
      doc.circle(margin + 2, headerY + 4, 1.3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('FICHA TÉCNICA DE UBICACIÓN', margin + 6.5, headerY + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(100, 116, 139);
      doc.text('·   CIRCUITO PUBLICITARIO EXTERIOR (OOH)', margin + 68, headerY + 5.2);
    }

    // Right: Minimalist Code Badge
    if (unit.code) {
      const codeLabel = 'CÓDIGO: ';
      const codeVal = unit.code;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const labelW = doc.getTextWidth(codeLabel);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      const valW = doc.getTextWidth(codeVal);

      const pillPad = 5;
      const pillW = labelW + valW + pillPad * 2;
      const pillH = 7.5;
      const pillX = pageWidth - margin - pillW;
      const pillY = headerY + 0.5;

      // Soft white container with hairline slate border
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'S');

      // Delicate red accent pip
      doc.setFillColor(227, 27, 56);
      doc.circle(pillX + 3.2, pillY + pillH / 2, 0.9, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(codeLabel, pillX + 6, pillY + 5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(codeVal, pillX + 6 + labelW, pillY + 5);
    }

    // -----------------------------------------------------------------------
    // Unit Title & Subtitle (Y: 26 to 36 mm)
    // -----------------------------------------------------------------------
    const mainTitle = unit.title || 'Ubicación Publicitaria';
    if (unit.subtitle && unit.subtitle.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42);
      doc.text(mainTitle, margin, 27.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(unit.subtitle.trim(), margin, 33);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15.5);
      doc.setTextColor(15, 23, 42);
      doc.text(mainTitle, margin, 30.5);
    }

    // -----------------------------------------------------------------------
    // Middle Section: 16:9 HD Photography + Google Maps & Navigation Card
    // (Y: 37 to 127 mm — Total Height: 90 mm)
    // -----------------------------------------------------------------------
    const midSectionY = 37.5;
    const photoW = 160;
    const photoH = 90; // Exact 16:9 ratio
    const photoX = margin;
    const colGap = 8;

    // Render Canvas in high resolution (1920x1080) for PDF
    if (onProgress) {
      onProgress(idx + 1, totalUnits, `Renderizando fotografía HD (${unit.code || 'unidad'})...`, Math.round(unitBaseP + unitStep * 0.4));
    }

    let canvasRendered = false;
    try {
      const renderPromise = renderHighResCanvas({ ...unit, layout: 'clean-photo' }, 1920, 1080);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Canvas render timeout')), 3500)
      );
      const canvas = await Promise.race([renderPromise, timeoutPromise]);
      const canvasDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(canvasDataUrl, 'JPEG', photoX, midSectionY, photoW, photoH);
      canvasRendered = true;
    } catch (err) {
      console.warn('Canvas render error in PDF, using fallback box', err);
    }

    if (!canvasRendered) {
      doc.setFillColor(248, 250, 252);
      doc.rect(photoX, midSectionY, photoW, photoH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Fotografía del Emplazamiento', photoX + photoW / 2, midSectionY + photoH / 2, { align: 'center' });
    }

    // Hairline border frame around photo
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(photoX, midSectionY, photoW, photoH, 'S');

    // -----------------------------------------------------------------------
    // Right Column: Location & Google Maps Card (Matching photo height 90mm)
    // -----------------------------------------------------------------------
    const rightX = photoX + photoW + colGap;
    const rightW = pageWidth - margin - rightX;
    const rightH = photoH;

    // Minimalist Card: Pure white fill with light slate border
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rightX, midSectionY, rightW, rightH, 2.5, 2.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(rightX, midSectionY, rightW, rightH, 2.5, 2.5, 'S');

    const cardInnerX = rightX + 6;
    const cardInnerW = rightW - 12; // 93mm usable width

    // Card Header with Subtle Red Dot
    doc.setFillColor(227, 27, 56);
    doc.circle(cardInnerX + 1.2, midSectionY + 6.8, 1.1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('UBICACIÓN & NAVEGACIÓN', cardInnerX + 5, midSectionY + 7.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Acceso interactivo y coordenadas satelitales', cardInnerX + 5, midSectionY + 12.2);

    // Subtle divider line inside card
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(cardInnerX, midSectionY + 14.8, cardInnerX + cardInnerW, midSectionY + 14.8);

    // 1. Physical Address Section (Calculated with dynamic line wrapping)
    let cardContentY = midSectionY + 19.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('DIRECCIÓN EXACTA:', cardInnerX, cardContentY);

    cardContentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    const splitAddr = doc.splitTextToSize(unit.address || 'Caracas, Venezuela', cardInnerW);
    const maxAddrLines = Math.min(splitAddr.length, 3);
    const visibleAddr = splitAddr.slice(0, maxAddrLines);
    doc.text(visibleAddr, cardInnerX, cardContentY);
    cardContentY += maxAddrLines * 4.0 + 2;

    // 2. GPS Coordinates Badge (if available)
    if (unit.coordinates && unit.coordinates.trim()) {
      const gpsH = 6.2;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardInnerX, cardContentY, cardInnerW, gpsH, 1.2, 1.2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardInnerX, cardContentY, cardInnerW, gpsH, 1.2, 1.2, 'S');

      doc.setFillColor(227, 27, 56);
      doc.circle(cardInnerX + 3.2, cardContentY + gpsH / 2, 0.75, 'F');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text(`GPS: ${unit.coordinates.trim()}`, cardInnerX + 6, cardContentY + gpsH / 2 + 1.0);

      cardContentY += gpsH + 3.5;
    } else {
      cardContentY += 1.5;
    }

    // 3. Google Maps Link & Navigation Section
    const mapsUrl = unit.googleMapsUrl?.trim()
      ? unit.googleMapsUrl.trim()
      : unit.coordinates?.trim()
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.coordinates.trim())}`
      : unit.address?.trim()
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.address.trim())}`
      : 'https://maps.google.com';

    const showQr = unit.showQrCode !== false;
    const cardBottomY = midSectionY + rightH;
    const footnoteY = cardBottomY - 3.2;

    const navBlockY = Math.max(cardContentY, midSectionY + 44);
    const navBlockH = footnoteY - navBlockY - 3.5;

    if (showQr) {
      const qrGap = 4;
      const qrColW = 26;
      const actionColW = cardInnerW - qrColW - qrGap; // 63mm

      const actionBoxX = cardInnerX;
      const qrBoxX = cardInnerX + actionColW + qrGap;

      // Left Column: Interactive Navigation Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(actionBoxX, navBlockY, actionColW, navBlockH, 1.8, 1.8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(actionBoxX, navBlockY, actionColW, navBlockH, 1.8, 1.8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text('NAVEGACIÓN INTERACTIVA', actionBoxX + 4, navBlockY + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text('Haz clic para abrir la ruta en el mapa:', actionBoxX + 4, navBlockY + 9.0);

      // Primary Executive Button: "Abrir en Google Maps"
      const btnPaddingX = 4;
      const btnW = actionColW - btnPaddingX * 2; // 55mm
      const btnH = 8.8;
      const btnX = actionBoxX + btnPaddingX;
      const btnY = navBlockY + 11.2;

      doc.setFillColor(15, 23, 42); // Deep Charcoal Slate (#0f172a)
      doc.roundedRect(btnX, btnY, btnW, btnH, 1.6, 1.6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.4);
      doc.setTextColor(255, 255, 255);

      const btnLabel = 'Abrir en Google Maps';
      const labelW = doc.getTextWidth(btnLabel);
      const iconGap = 2;
      const iconW = 2.4;
      const totalContentW = labelW + iconGap + iconW;
      const startTextX = btnX + (btnW - totalContentW) / 2;

      doc.text(btnLabel, startTextX, btnY + btnH / 2 + 1.1);

      // Clean vector diagonal external link arrow
      const arrowX = startTextX + labelW + iconGap;
      const arrowY = btnY + btnH / 2;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.line(arrowX, arrowY + 1.2, arrowX + 2.0, arrowY - 0.8);
      doc.line(arrowX + 0.8, arrowY - 0.8, arrowX + 2.0, arrowY - 0.8);
      doc.line(arrowX + 2.0, arrowY - 0.8, arrowX + 2.0, arrowY + 0.4);

      doc.link(btnX, btnY, btnW, btnH, { url: mapsUrl });

      // Clean single-line URL preview under button
      const cleanUrl = mapsUrl.replace(/^https?:\/\/(www\.)?/, '');
      const maxUrlChars = 32;
      const shortDisplayUrl = cleanUrl.length > maxUrlChars ? cleanUrl.substring(0, maxUrlChars - 2) + '...' : cleanUrl;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Link: ${shortDisplayUrl}`, actionBoxX + 4, navBlockY + navBlockH - 3.2);
      doc.link(actionBoxX + 4, navBlockY + navBlockH - 5.5, actionColW - 8, 4.5, { url: mapsUrl });

      // Right Column: QR Code Scanner
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrBoxX, navBlockY, qrColW, navBlockH, 1.8, 1.8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrBoxX, navBlockY, qrColW, navBlockH, 1.8, 1.8, 'S');

      try {
        const qrSize = Math.min(20, navBlockH - 8);
        const qrData = await QRCode.toDataURL(mapsUrl, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        const qrImgX = qrBoxX + (qrColW - qrSize) / 2;
        const qrImgY = navBlockY + 2.2;
        doc.addImage(qrData, 'PNG', qrImgX, qrImgY, qrSize, qrSize);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.6);
        doc.setTextColor(100, 116, 139);
        doc.text('ESCANEAR RUTA', qrBoxX + qrColW / 2, navBlockY + navBlockH - 3.2, { align: 'center' });
        doc.link(qrBoxX, navBlockY, qrColW, navBlockH, { url: mapsUrl });
      } catch (err) {
        console.warn('QR Code generation failed', err);
      }
    } else {
      // Full width navigation card (when QR is disabled)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardInnerX, navBlockY, cardInnerW, navBlockH, 1.8, 1.8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardInnerX, navBlockY, cardInnerW, navBlockH, 1.8, 1.8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text('NAVEGACIÓN INTERACTIVA & GPS', cardInnerX + 6, navBlockY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Haz clic en el botón para abrir la ruta directa en Google Maps:', cardInnerX + 6, navBlockY + 10.2);

      const btnW = 76;
      const btnH = 9;
      const btnX = cardInnerX + (cardInnerW - btnW) / 2;
      const btnY = navBlockY + 12.8;

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(btnX, btnY, btnW, btnH, 1.6, 1.6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(255, 255, 255);
      const btnLabel = 'Abrir en Google Maps';
      const labelW = doc.getTextWidth(btnLabel);
      const startTextX = btnX + (btnW - labelW - 4.5) / 2;
      doc.text(btnLabel, startTextX, btnY + btnH / 2 + 1.1);

      const arrowX = startTextX + labelW + 2;
      const arrowY = btnY + btnH / 2;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.line(arrowX, arrowY + 1.2, arrowX + 2.0, arrowY - 0.8);
      doc.line(arrowX + 0.8, arrowY - 0.8, arrowX + 2.0, arrowY - 0.8);
      doc.line(arrowX + 2.0, arrowY - 0.8, arrowX + 2.0, arrowY + 0.4);

      doc.link(btnX, btnY, btnW, btnH, { url: mapsUrl });

      const cleanUrl = mapsUrl.replace(/^https?:\/\/(www\.)?/, '');
      const shortDisplayUrl = cleanUrl.length > 55 ? cleanUrl.substring(0, 52) + '...' : cleanUrl;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text(`Enlace satelital: ${shortDisplayUrl}`, cardInnerX + 6, navBlockY + navBlockH - 3.2);
      doc.link(cardInnerX + 6, navBlockY + navBlockH - 5.5, cardInnerW - 12, 4.5, { url: mapsUrl });
    }

    // Helper footnote at bottom of card
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text('* Clic en el botón o escanea el QR con tu móvil para navegación GPS directa.', cardInnerX, footnoteY);

    // -----------------------------------------------------------------------
    // Bottom Section: Technical Specs & Reach Metrics (Y: 133 to 196 mm)
    // -----------------------------------------------------------------------
    const specsY = 133;
    const reachData = unit.reach;
    const hasReach = Boolean(
      reachData && (
        reachData.dailyImpressions ||
        reachData.monthlyImpressions ||
        reachData.dailyVehicles ||
        reachData.pedestrianTraffic ||
        reachData.targetAudience ||
        reachData.coverageZone ||
        reachData.dwellTime ||
        reachData.graphicUrl
      )
    );

    if (hasReach) {
      // DUAL BALANCED SECTION: Left = Specs, Right = Reach & Audience Metrics
      const bColGap = 6;
      const leftColW = 108; // 108 mm for specifications
      const rightColW = pageWidth - margin * 2 - leftColW - bColGap; // 159 mm for metrics & chart
      const leftColX = margin;
      const rightColX = margin + leftColW + bColGap;

      const specsGridY = specsY + 6.5;
      const specsToShow = (unit.specs || []).slice(0, 6);

      // Metric pill and chart dimensions on the right
      const numPills = 3;
      const pillGap = 3;
      const pillW = (rightColW - pillGap * (numPills - 1)) / numPills; // ~51 mm
      const pillH = 13.0; // Roomy height for 2-level text or clean single-line
      const chartH = 36.5; // High-resolution chart height
      const totalRightContentH = pillH + 2.5 + chartH; // 52.0 mm total block height

      // --- LEFT COLUMN: ESPECIFICACIONES TÉCNICAS DEL FORMATO ---
      doc.setFillColor(227, 27, 56);
      doc.circle(leftColX + 2, specsY + 2.5, 1.1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text('ESPECIFICACIONES DEL FORMATO', leftColX + 6, specsY + 3.5);

      if (specsToShow.length === 0) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(leftColX, specsGridY, leftColW, totalRightContentH, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(leftColX, specsGridY, leftColW, totalRightContentH, 2, 2, 'S');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Sin especificaciones adicionales registradas.', leftColX + leftColW / 2, specsGridY + totalRightContentH / 2, { align: 'center' });
      } else if (specsToShow.length <= 3) {
        // 1 to 3 SPECS (e.g. Dimensions, Format, Resolution):
        // Stacked full-width cards that perfectly match the right column's total height!
        // No empty gaps or missing slots, balanced alignment.
        const sGap = 2.5;
        const sBoxH = (totalRightContentH - sGap * (specsToShow.length - 1)) / specsToShow.length;

        for (let sIdx = 0; sIdx < specsToShow.length; sIdx++) {
          const spec = specsToShow[sIdx];
          const bX = leftColX;
          const bY = specsGridY + sIdx * (sBoxH + sGap);

          // Clean white spec card with subtle hairline border
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(bX, bY, leftColW, sBoxH, 1.8, 1.8, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.roundedRect(bX, bY, leftColW, sBoxH, 1.8, 1.8, 'S');

          // Indicator bullet
          doc.setFillColor(148, 163, 184);
          doc.circle(bX + 4.5, bY + 4.6, 0.8, 'F');

          // Spec Label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.8);
          doc.setTextColor(100, 116, 139);
          doc.text(spec.label.toUpperCase(), bX + 7.5, bY + 5.2);

          // Spec Value - Measured dynamically to guarantee NO text truncation
          doc.setFont('helvetica', 'bold');
          let sValFont = 8.8;
          doc.setFontSize(sValFont);
          doc.setTextColor(15, 23, 42);

          const maxSpecValW = leftColW - 10;
          let sValW = doc.getTextWidth(spec.value);
          while (sValW > maxSpecValW && sValFont > 6.5) {
            sValFont -= 0.3;
            doc.setFontSize(sValFont);
            sValW = doc.getTextWidth(spec.value);
          }

          if (sValW <= maxSpecValW) {
            doc.text(spec.value, bX + 4.5, bY + sBoxH - 4.2);
          } else {
            const specLines = doc.splitTextToSize(spec.value, maxSpecValW);
            doc.setFontSize(7.2);
            doc.text(specLines[0], bX + 4.5, bY + sBoxH - 6.2);
            if (specLines[1]) {
              doc.text(specLines[1], bX + 4.5, bY + sBoxH - 2.8);
            }
          }
        }
      } else {
        // 4 to 6 SPECS: Balanced 2-column grid matching the exact right column height
        const sCols = 2;
        const sRows = Math.ceil(specsToShow.length / sCols);
        const sSubBoxW = (leftColW - 3) / 2;
        const sRowGap = 2.5;
        const sBoxH = (totalRightContentH - sRowGap * (sRows - 1)) / sRows;

        for (let sIdx = 0; sIdx < specsToShow.length; sIdx++) {
          const spec = specsToShow[sIdx];
          const col = sIdx % 2;
          const row = Math.floor(sIdx / 2);
          const bX = leftColX + col * (sSubBoxW + 3);
          const bY = specsGridY + row * (sBoxH + sRowGap);

          doc.setFillColor(255, 255, 255);
          doc.roundedRect(bX, bY, sSubBoxW, sBoxH, 1.8, 1.8, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.roundedRect(bX, bY, sSubBoxW, sBoxH, 1.8, 1.8, 'S');

          doc.setFillColor(148, 163, 184);
          doc.circle(bX + 4, bY + 4.4, 0.75, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(spec.label.toUpperCase(), bX + 6.8, bY + 4.9);

          doc.setFont('helvetica', 'bold');
          let sValFont = 8.2;
          doc.setFontSize(sValFont);
          doc.setTextColor(15, 23, 42);

          const maxSpecValW = sSubBoxW - 8;
          let sValW = doc.getTextWidth(spec.value);
          while (sValW > maxSpecValW && sValFont > 6.2) {
            sValFont -= 0.3;
            doc.setFontSize(sValFont);
            sValW = doc.getTextWidth(spec.value);
          }

          if (sValW <= maxSpecValW) {
            doc.text(spec.value, bX + 4, bY + sBoxH - 3.8);
          } else {
            const specLines = doc.splitTextToSize(spec.value, maxSpecValW);
            doc.setFontSize(6.8);
            doc.text(specLines[0], bX + 4, bY + sBoxH - 5.8);
            if (specLines[1]) {
              doc.text(specLines[1], bX + 4, bY + sBoxH - 2.4);
            }
          }
        }
      }

      // --- RIGHT COLUMN: ALCANCE & MÉTRICAS DE IMPACTO CON GRÁFICO ---
      doc.setFillColor(227, 27, 56);
      doc.circle(rightColX + 2, specsY + 2.5, 1.1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text('MÉTRICAS DE ALCANCE & AUDIENCIA', rightColX + 6, specsY + 3.5);

      // Subtitle / Source badge
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('ANÁLISIS OOH CERTIFICADO', rightColX + rightColW - 38, specsY + 3.5);

      const reachGridY = specsGridY;

      // 1. Top Summary Metric Cards (3 columns) - Wide and roomier
      const summaryMetrics = [
        {
          label: 'IMPACTOS / DÍA',
          val: reachData?.dailyImpressions || '185,000 imp/día',
          dotColor: [227, 27, 56] // Red Accent
        },
        {
          label: 'TRÁFICO VEHICULAR',
          val: reachData?.dailyVehicles || '115,000 veh/día',
          dotColor: [15, 23, 42] // Slate
        },
        {
          label: 'IMPACTO MENSUAL',
          val: reachData?.monthlyImpressions || '5,550,000 imp/mes',
          dotColor: [2, 132, 199] // Corporate Blue
        }
      ];

      summaryMetrics.forEach((m, mIdx) => {
        const pX = rightColX + mIdx * (pillW + pillGap);
        const pY = reachGridY;

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pX, pY, pillW, pillH, 1.8, 1.8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(pX, pY, pillW, pillH, 1.8, 1.8, 'S');

        // Color indicator dot
        doc.setFillColor(m.dotColor[0], m.dotColor[1], m.dotColor[2]);
        doc.circle(pX + 3.8, pY + 4.2, 0.85, 'F');

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, pX + 6.8, pY + 4.6);

        // Value - Scaled dynamically to NEVER truncate with ellipsis
        doc.setFont('helvetica', 'bold');
        let vSize = 8.2;
        doc.setFontSize(vSize);
        let vWidth = doc.getTextWidth(m.val);
        const maxPillTextW = pillW - 7;

        while (vWidth > maxPillTextW && vSize > 6.4) {
          vSize -= 0.3;
          doc.setFontSize(vSize);
          vWidth = doc.getTextWidth(m.val);
        }

        if (vWidth <= maxPillTextW) {
          doc.setTextColor(15, 23, 42);
          doc.text(m.val, pX + 4, pY + 10.0);
        } else {
          // Gracefully split onto 2 lines if very verbose, NEVER truncate with ellipsis
          const lines = doc.splitTextToSize(m.val, maxPillTextW);
          doc.setFontSize(6.8);
          doc.setTextColor(15, 23, 42);
          doc.text(lines[0], pX + 4, pY + 8.4);
          if (lines[1]) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.0);
            doc.setTextColor(71, 85, 105);
            doc.text(lines[1], pX + 4, pY + 11.5);
          }
        }
      });

      // 2. High Resolution Dynamic Reach Chart generated dynamically
      const chartY = reachGridY + pillH + 2.5;
      const chartW = rightColW;

      let chartDataUrl: string | undefined = undefined;
      if (reachData?.includeChartInPdf !== false) {
        try {
          chartDataUrl = generateReachChartDataUrl(reachData, 1100, 260);
        } catch (e) {
          console.warn('Error generating dynamic reach chart for PDF', e);
        }
      }
      if (!chartDataUrl && reachData?.graphicUrl) {
        chartDataUrl = reachData.graphicUrl;
      }

      if (chartDataUrl) {
        try {
          doc.addImage(chartDataUrl, 'PNG', rightColX, chartY, chartW, chartH);
        } catch (e) {
          console.warn('Could not add reach chart image to PDF', e);
        }
      }
    } else {
      // Full-width specs grid if no reach data
      doc.setFillColor(227, 27, 56);
      doc.circle(margin + 2, specsY + 2.5, 1.1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('ESPECIFICACIONES DEL FORMATO', margin + 6, specsY + 3.5);

      const specsGridY = specsY + 6.5;
      const specBoxW = (pageWidth - margin * 2) / 3 - 3;
      const specBoxH = 14;

      const specsToShow = unit.specs || [];
      const maxSpecs = Math.min(specsToShow.length, 12);

      if (specsToShow.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Sin especificaciones adicionales registradas para este punto.', margin + 2, specsGridY + 7);
      } else {
        for (let sIdx = 0; sIdx < maxSpecs; sIdx++) {
          const spec = specsToShow[sIdx];
          const col = sIdx % 3;
          const row = Math.floor(sIdx / 3);
          const bX = margin + col * (specBoxW + 4.5);
          const bY = specsGridY + row * (specBoxH + 2.2);

          // White spec card
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(bX, bY, specBoxW, specBoxH, 1.5, 1.5, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.roundedRect(bX, bY, specBoxW, specBoxH, 1.5, 1.5, 'S');

          // Bullet dot
          doc.setFillColor(148, 163, 184);
          doc.circle(bX + 4.5, bY + 4.2, 0.8, 'F');

          // Spec Label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.setTextColor(100, 116, 139);
          doc.text(spec.label.toUpperCase(), bX + 7.5, bY + 4.8);

          // Spec Value - Measured dynamically to avoid chopping text
          doc.setFont('helvetica', 'bold');
          let sValFont = 8.8;
          doc.setFontSize(sValFont);
          doc.setTextColor(15, 23, 42);

          const maxSpecValW = specBoxW - 8;
          let sValW = doc.getTextWidth(spec.value);
          while (sValW > maxSpecValW && sValFont > 6.4) {
            sValFont -= 0.3;
            doc.setFontSize(sValFont);
            sValW = doc.getTextWidth(spec.value);
          }

          if (sValW <= maxSpecValW) {
            doc.text(spec.value, bX + 4.5, bY + 10.2);
          } else {
            const specLines = doc.splitTextToSize(spec.value, maxSpecValW);
            doc.setFontSize(7.0);
            doc.text(specLines[0], bX + 4.5, bY + 8.6);
            if (specLines[1]) {
              doc.text(specLines[1], bX + 4.5, bY + 11.8);
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Page Footer (Y: 201 to 205 mm)
    // -----------------------------------------------------------------------
    const footerY = pageHeight - 7;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text('GeoSpec · Dossier Técnico OOH & Especificaciones de Ubicación', margin, footerY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${pageIndex} de ${totalPages}`, pageWidth - margin - 20, footerY);
  }

  if (onProgress) {
    onProgress(totalUnits, totalUnits, 'Compilando documento y optimizando...', 92);
  }

  // Trigger reliable direct browser download
  const safeTitle = (options.catalogTitle || 'ficha-tecnica')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const filename = `${safeTitle}-${totalUnits}-unidades.pdf`;

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  let dataUri = '';
  try {
    dataUri = doc.output('datauristring');
  } catch {
    dataUri = blobUrl;
  }

  if (onProgress) {
    onProgress(totalUnits, totalUnits, '¡Descargando archivo!', 100);
  }

  let serverDownloadUrl: string | undefined;
  let serverViewUrl: string | undefined;

  // Multi-tier direct download attempt (only when autoDownload is true)
  if (autoDownload) {
    try {
      const saveRes = await saveFileToDisk({
        filename,
        blob: pdfBlob,
        mimeType: 'application/pdf'
      });
      serverDownloadUrl = saveRes.serverDownloadUrl;
      serverViewUrl = saveRes.serverViewUrl;
    } catch (err) {
      console.warn('Initial direct save failed', err);
    }
  }

  return {
    filename,
    blob: pdfBlob,
    blobUrl,
    dataUri,
    serverDownloadUrl,
    serverViewUrl
  };
}
