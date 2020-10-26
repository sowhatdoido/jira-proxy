
require('dotenv').config()

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const proxy = require('http-proxy-middleware').createProxyMiddleware;
const helmet = require('helmet');

const jira_instance = process.env.JIRA_HOST;
const jsonPlaceholderProxy = proxy({
  target: jira_instance,
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logLevel: process.env.LOG_LEVEL || 'silent',
  onProxyReq: (proxyReq, req, res) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    let token = (login === 'nouser') ? password : undefined;
    proxyReq.setHeader("Accept", "application/json");
    proxyReq.setHeader("X-Atlassian-Token", "no-check");
    proxyReq.setHeader("cookie", `JSESSIONID=${token};`);
    proxyReq.setHeader("User-Agent", "");
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    proxyRes.headers['Access-Control-Max-Age'] = '600';
  }
});

const app = express();
app.use(helmet());
// app.use(express.static(__dirname, { dotfiles: 'allow' } ));
app.use('/rest/api', jsonPlaceholderProxy);


// Starting both http & https servers
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
	console.log(`HTTP Proxy running on port ${port}`);
});

const useSSL = process.env.USE_SSL ? !!JSON.parse(String(process.env.USE_SSL).toLowerCase()) : false;

if (useSSL){
  const privateKey = fs.readFileSync(`${process.env.LETSENCRYPT_DOMAIN_PATH}/privkey.pem`, 'utf8');
  const certificate = fs.readFileSync(`${process.env.LETSENCRYPT_DOMAIN_PATH}/cert.pem`, 'utf8');
  const ca = fs.readFileSync(`${process.env.LETSENCRYPT_DOMAIN_PATH}/chain.pem`, 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };

  const httpsServer = https.createServer(credentials, app);
  const sslPort = process.env.SSL_PORT || 3443;
  httpsServer.listen(sslPort, () => {
    console.log(`HTTPS Proxy running on port ${sslPort}`);
  });
}