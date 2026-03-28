const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/appointments', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to http://localhost:3003${req.url}`);
  }
}));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
