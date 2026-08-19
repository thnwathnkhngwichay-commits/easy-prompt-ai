const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // 1. Handle HTTP Method
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
    return;
  }

  // 2. Extract pathname and strip query strings (Requirements 3 & 4)
  const rawPathname = req.url.split('?')[0];

  // Safe URI decoding for Thai characters and special characters
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPathname);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request: Invalid URI Encoding');
    return;
  }

  // Reject null byte injection
  if (decodedPath.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request: Null Byte Detected');
    return;
  }

  // Default root to index.html
  if (decodedPath === '/' || decodedPath === '') {
    decodedPath = '/index.html';
  }

  // 3. Strict Path Traversal Prevention (Requirement 5)
  // Resolve relative to ROOT_DIR and check if the resulting path remains strictly inside ROOT_DIR
  const targetPath = path.resolve(ROOT_DIR, '.' + decodedPath);

  if (targetPath !== ROOT_DIR && !targetPath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  // 4. File Resolution & Serving
  fs.stat(targetPath, (err, stats) => {
    if (err || !stats) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    // If path points to a directory, try index.html inside it
    if (stats.isDirectory()) {
      const indexFilePath = path.join(targetPath, 'index.html');
      fs.stat(indexFilePath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }
        serveFile(req, res, indexFilePath, indexStats);
      });
      return;
    }

    if (stats.isFile()) {
      serveFile(req, res, targetPath, stats);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  });
});

function serveFile(req, res, filePath, stats) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileSize = stats.size;
  const range = req.headers.range;

  // Support Range requests (essential for HTML5 video seeking & buffering - Requirement 2)
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || (end && end >= fileSize) || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('416 Range Not Satisfiable');
      return;
    }

    const chunksize = (end - start) + 1;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };

    res.writeHead(206, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    });
    stream.pipe(res);
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    };

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    });
    stream.pipe(res);
  }
}

server.listen(PORT, () => {
  console.log(`Easy Prompt AI local server is running at http://localhost:${PORT}/`);
});
