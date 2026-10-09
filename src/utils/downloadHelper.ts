/**
 * Robust cross-browser and iframe-safe file download utility.
 * Sends file to server-side HTTP streaming endpoint for guaranteed downloads,
 * with multi-tier client fallbacks (File System Access API, Blob URL, Data URI).
 */

export interface SaveFileOptions {
  filename: string;
  blob: Blob;
  mimeType?: string;
}

export interface SaveFileResult {
  success: boolean;
  serverDownloadUrl?: string;
  serverViewUrl?: string;
  method: 'server' | 'picker' | 'blob' | 'datauri';
}

/**
 * Converts a Blob to a pure Base64 string using fast native FileReader
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = (reader.result as string) || '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads a file with multi-layered fail-safe mechanisms:
 * 1. Server HTTP Attachment download (works across all browsers and sandboxed iframes)
 * 2. File System Access API (showSaveFilePicker)
 * 3. Client-side Blob URL anchor trigger
 * 4. Base64 Octet-Stream trigger
 */
export async function saveFileToDisk(options: SaveFileOptions): Promise<SaveFileResult> {
  const { filename, blob, mimeType = blob.type || 'application/octet-stream' } = options;

  let serverDownloadUrl = '';
  let serverViewUrl = '';

  // Tier 1: Server HTTP attachment endpoint (Bypasses all iframe download sandbox restrictions)
  try {
    const base64 = await blobToBase64(blob);
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch('/api/download/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        base64,
        mimeType
      }),
      signal: controller.signal
    });
    clearTimeout(fetchTimer);

    if (resp.ok) {
      const data = await resp.json();
      serverDownloadUrl = data.downloadUrl;
      serverViewUrl = data.viewUrl;

      // Trigger HTTP attachment download
      const a = document.createElement('a');
      a.href = serverDownloadUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);

      return {
        success: true,
        serverDownloadUrl,
        serverViewUrl,
        method: 'server'
      };
    }
  } catch (serverErr) {
    console.warn('Server download endpoint unavailable, using client fallback', serverErr);
  }

  // Tier 2: Try modern File System Access API (window.showSaveFilePicker)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const isPdf = filename.endsWith('.pdf') || mimeType.includes('pdf');
      const isPng = filename.endsWith('.png') || mimeType.includes('png');
      const isJpg = filename.endsWith('.jpg') || filename.endsWith('.jpeg') || mimeType.includes('jpeg');

      const acceptTypes: Record<string, string[]> = {};
      if (isPdf) {
        acceptTypes['application/pdf'] = ['.pdf'];
      } else if (isPng) {
        acceptTypes['image/png'] = ['.png'];
      } else if (isJpg) {
        acceptTypes['image/jpeg'] = ['.jpg', '.jpeg'];
      } else {
        acceptTypes[mimeType] = [`.${filename.split('.').pop() || 'bin'}`];
      }

      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: isPdf ? 'Documento PDF' : 'Archivo',
            accept: acceptTypes
          }
        ]
      });

      const writableStream = await fileHandle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();
      return { success: true, method: 'picker' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'picker' };
      }
    }
  }

  // Tier 3: Standard Anchor click with Blob URL
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    }, 1000);

    return { success: true, method: 'blob' };
  } catch (err) {
    console.warn('Anchor blob download failed', err);
  }

  // Tier 4: Octet-stream Base64 Data URI fallback
  try {
    const base64 = await blobToBase64(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = `data:application/octet-stream;base64,${base64}`;
    downloadLink.download = filename;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink);
      }
    }, 1000);
    return { success: true, method: 'datauri' };
  } catch (err) {
    console.error('All download methods failed', err);
    return { success: false, method: 'datauri' };
  }
}
