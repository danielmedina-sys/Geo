import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Determine port: Always prefer CLI arg --port, then default to 3000.
// In Cloud Run, PORT=8080 is reserved for nginx, so the app dev server must use port 3000.
function getPort(): number {
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' || args[i] === '-p') {
      const p = Number(args[i + 1]);
      if (!isNaN(p) && p > 0) return p;
    }
    if (args[i].startsWith('--port=')) {
      const p = Number(args[i].split('=')[1]);
      if (!isNaN(p) && p > 0) return p;
    }
  }
  if (process.env.APP_PORT) return Number(process.env.APP_PORT);
  if (process.env.PORT && Number(process.env.PORT) !== 8080) {
    return Number(process.env.PORT);
  }
  return 3000;
}

const PORT = getPort();

// Body parser for JSON with large payload (for base64 PDFs and high-res images)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// In-memory store for pending file downloads
interface DownloadItem {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}

const downloadStore = new Map<string, DownloadItem>();

// Cleanup expired files every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of downloadStore.entries()) {
    if (now - item.createdAt > 20 * 60 * 1000) {
      downloadStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

// API route to register a file for guaranteed HTTP attachment download
app.post('/api/download/prepare', (req, res) => {
  try {
    const { filename, base64, mimeType } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: 'Missing required parameters (filename, base64)' });
    }

    const token = 'dl_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    downloadStore.set(token, {
      filename,
      buffer,
      mimeType: mimeType || 'application/pdf',
      createdAt: Date.now()
    });

    res.json({
      token,
      downloadUrl: `/api/download/file/${token}`,
      viewUrl: `/api/download/view/${token}`,
      sizeBytes: buffer.length
    });
  } catch (err: any) {
    console.error('Error in /api/download/prepare:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Route that sends HTTP headers for forced browser download (Content-Disposition: attachment)
app.get('/api/download/file/:token', (req, res) => {
  const token = req.params.token;
  const item = downloadStore.get(token);
  if (!item) {
    return res.status(404).send('El enlace de descarga ha expirado. Por favor genera el documento nuevamente.');
  }

  const encodedFilename = encodeURIComponent(item.filename);
  res.setHeader('Content-Type', item.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );
  res.setHeader('Content-Length', item.buffer.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(item.buffer);
});

// Route that displays the PDF inline in a new tab
app.get('/api/download/view/:token', (req, res) => {
  const token = req.params.token;
  const item = downloadStore.get(token);
  if (!item) {
    return res.status(404).send('El documento ha expirado. Por favor genera el documento nuevamente.');
  }

  const encodedFilename = encodeURIComponent(item.filename);
  res.setHeader('Content-Type', item.mimeType);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );
  res.setHeader('Content-Length', item.buffer.length);
  res.send(item.buffer);
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        cors: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
