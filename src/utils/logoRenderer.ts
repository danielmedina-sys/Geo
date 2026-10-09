import { jsPDF } from 'jspdf';
import { ENFOQUE_LOGO_DATA_URL } from '../assets/enfoqueLogoData';

/**
 * Draws the official ENFOQUE MEDIOS logo directly onto an HTML5 Canvas context.
 * Aspect ratio: 540 / 180 = 3.0
 */
export function drawEnfoqueEmblemCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();

  const scaleX = w / 540;
  const scaleY = h / 180;

  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 540, 180);

  // Outer Box with bottom opening for MEDIOS on the left
  ctx.lineWidth = 13;
  ctx.strokeStyle = '#181b20';
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(84, 148);
  ctx.lineTo(20, 148);
  ctx.lineTo(20, 20);
  ctx.lineTo(520, 20);
  ctx.lineTo(520, 148);
  ctx.lineTo(228, 148);
  ctx.stroke();

  // E
  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  // Fill E path
  ctx.rect(42, 46, 14, 72); // vertical stem
  ctx.rect(56, 46, 30, 14); // top arm
  ctx.rect(56, 75, 24, 14); // middle arm
  ctx.rect(56, 104, 30, 14); // bottom arm
  ctx.fill();

  // N
  ctx.beginPath();
  ctx.rect(104, 46, 14, 72); // left stem
  ctx.rect(138, 46, 14, 72); // right stem
  // diagonal
  ctx.moveTo(104, 46);
  ctx.lineTo(118, 46);
  ctx.lineTo(152, 118);
  ctx.lineTo(138, 118);
  ctx.closePath();
  ctx.fill();

  // F
  ctx.beginPath();
  ctx.rect(170, 46, 14, 72); // vertical stem
  ctx.rect(184, 46, 28, 14); // top arm
  ctx.rect(184, 75, 22, 14); // middle arm
  ctx.fill();

  // O in Enfoque Red
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#e31b38';
  ctx.beginPath();
  ctx.arc(252, 82, 29, 0, Math.PI * 2);
  ctx.stroke();

  // Q in Enfoque Red
  ctx.beginPath();
  ctx.arc(338, 82, 29, 0, Math.PI * 2);
  ctx.stroke();

  // Q underline horizontal bar
  ctx.fillStyle = '#e31b38';
  ctx.fillRect(320, 124, 36, 10);

  // U
  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.rect(392, 46, 14, 52); // left stem
  ctx.rect(428, 46, 14, 52); // right stem
  // bottom curve
  ctx.arc(417, 98, 25, 0, Math.PI);
  ctx.arc(417, 98, 11, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();

  // Second E
  ctx.beginPath();
  ctx.rect(452, 46, 14, 72);
  ctx.rect(466, 46, 30, 14);
  ctx.rect(466, 75, 24, 14);
  ctx.rect(466, 104, 30, 14);
  ctx.fill();

  // MEDIOS on bottom left
  ctx.font = '900 24px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillStyle = '#181b20';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '3px';
  ctx.fillText('MEDIOS', 92, 156);

  ctx.restore();
}

/**
 * Returns raster Data URL of the official logo
 */
let cachedRasterDataUrl: string | null = null;

export function getEnfoqueRasterPNG(width = 1080, height = 360): string {
  if (cachedRasterDataUrl) return cachedRasterDataUrl;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return ENFOQUE_LOGO_DATA_URL;

    drawEnfoqueEmblemCanvas(ctx, 0, 0, width, height);
    cachedRasterDataUrl = canvas.toDataURL('image/png', 1.0);
    return cachedRasterDataUrl;
  } catch {
    return ENFOQUE_LOGO_DATA_URL;
  }
}

/**
 * Draws the official ENFOQUE MEDIOS logo vector/raster directly into jsPDF.
 */
export function drawEnfoqueEmblemPDF(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  try {
    const pngUrl = getEnfoqueRasterPNG(1080, 360);
    if (pngUrl) {
      doc.addImage(pngUrl, 'PNG', x, y, w, h);
      return;
    }
  } catch (e) {
    console.warn('PDF image logo drawing failed', e);
  }
}
