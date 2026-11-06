import http from 'node:http';
import path from 'node:path';
import { stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib.mjs';
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.woff2':'font/woff2' };
export function createServer({ directory = path.join(ROOT, 'dist') } = {}) {
  return http.createServer(async (req, res) => {
    try {
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, { Allow:'GET, HEAD' }); res.end(); return; }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.includes('\0') || pathname.split('/').some(x=>x.startsWith('.') && x!=='')) throw new Error('Forbidden');
      let file = path.resolve(directory, '.' + pathname);
      if (!file.startsWith(directory + path.sep) && file !== directory) throw new Error('Forbidden');
      let info = await stat(file);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(302, {Location:pathname + '/'}); res.end(); return; }
        file = path.join(file, 'index.html'); info = await stat(file);
      }
      if (!info.isFile()) throw new Error('Not found');
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found'); }
  });
}
export function startServer(options = {}) {
  const port = Number(process.env.PORT || 5173), host = process.env.HOST || '127.0.0.1';
  const server = createServer(options);
  server.on('error', e => { console.error(e.message); process.exitCode=1; });
  server.listen(port, host, () => console.log(`Local: http://${host}:${port}`));
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startServer();
