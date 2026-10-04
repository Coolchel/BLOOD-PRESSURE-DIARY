const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.DIARY_DESIGN_PORT || 43821);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.txt':'text/plain; charset=utf-8' };
const server = http.createServer((req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    fs.stat(filename, (error,stat) => {
      if (error || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
      if (req.method === 'HEAD') res.end(); else fs.createReadStream(filename).pipe(res);
    });
  } catch { res.writeHead(400); res.end('Bad request'); }
});
server.listen(port,'127.0.0.1',() => process.stdout.write('Design lab: http://localhost:'+port+'/\n'));
server.on('error',error => { process.stderr.write(error.message+'\n'); process.exitCode=1; });
