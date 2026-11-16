import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root)){res.writeHead(403);return res.end();}const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-cache'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4177,'127.0.0.1',()=>console.log('Syntarion Constellation · http://127.0.0.1:4177'));
