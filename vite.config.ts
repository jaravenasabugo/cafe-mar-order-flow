import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno desde .env files
  const env = loadEnv(mode, process.cwd(), '');
  const webhookUrl = env.VITE_ORDER_WEBHOOK_URL || 'https://n8n.srv1083720.hstgr.cloud/webhook/Ordenes';
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api/get-sheet-data': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Mantener el método y headers originales
              if (req.method === 'POST' || req.method === 'OPTIONS') {
                const contentType = req.headers['content-type'];
                if (contentType) {
                  proxyReq.setHeader('Content-Type', contentType);
                }
              }
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error para /api/get-sheet-data:', err);
              console.error('💡 Asegúrate de que el servidor esté ejecutándose: npm run dev:serverless');
            });
          },
        },
        '/api/send-order': {
          target: webhookUrl,
          changeOrigin: true,
          secure: true,
          rewrite: () => '', // Enviar directamente al webhook sin modificar el path
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Mantener el método y headers originales
              if (req.method === 'POST' || req.method === 'OPTIONS') {
                const contentType = req.headers['content-type'];
                if (contentType) {
                  proxyReq.setHeader('Content-Type', contentType);
                }
              }
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
