const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(503).json({ error: 'Backend server not available' });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.path);
      }
    })
  );
};
