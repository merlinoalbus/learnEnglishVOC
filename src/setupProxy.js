// =====================================================
// 🔀 src/setupProxy.js - Dev proxy per le chiamate /api
// =====================================================
// Durante `npm start` (CRA dev server su :3000) inoltra /api/* al backend
// (default http://localhost:3001). In dev dockerizzato impostare
// AI_PROXY_TARGET=http://backend:3001.
// http-proxy-middleware è già disponibile (dipendenza transitiva di react-scripts):
// nessuna nuova dipendenza richiesta.

const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: process.env.AI_PROXY_TARGET || "http://localhost:3001",
      changeOrigin: true,
    })
  );
};
