/**
 * Servidor local para ejecutar funciones serverless durante el desarrollo
 * Ejecuta: node server-local.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
const result = dotenv.config({ path: '.env' });

if (result.error) {
  console.warn('⚠️  No se pudo cargar .env:', result.error.message);
  console.warn('💡 Asegúrate de que el archivo .env exista en la raíz del proyecto');
} else {
  console.log('✅ Variables de entorno cargadas desde .env');
  console.log(`   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅' : '❌'}`);
  console.log(`   - GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? '✅' : '❌'}`);
}

const app = express();
const PORT = process.env.SERVERLESS_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));

// Función helper para ejecutar funciones serverless
async function runServerlessFunction(handler, req, res) {
  // Crear objetos req y res compatibles con Vercel
  const vercelReq = {
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
  };

  let responseSent = false;

  const vercelRes = {
    statusCode: 200,
    headers: {},
    setHeader: (key, value) => {
      if (!responseSent) {
        res.setHeader(key, value);
      }
    },
    status: (code) => {
      vercelRes.statusCode = code;
      if (!responseSent) {
        res.status(code);
      }
      return vercelRes;
    },
    json: (data) => {
      if (!responseSent) {
        responseSent = true;
        res.json(data);
      }
    },
    send: (data) => {
      if (!responseSent) {
        responseSent = true;
        res.send(data);
      }
    },
    end: () => {
      if (!responseSent) {
        responseSent = true;
        res.end();
      }
    },
  };

  try {
    await handler(vercelReq, vercelRes);
    // Si la función no envió respuesta, enviar una por defecto
    if (!responseSent) {
      console.log('⚠️  La función no envió respuesta, enviando respuesta por defecto');
      res.status(vercelRes.statusCode || 200).end();
    } else {
      console.log(`✅ Respuesta enviada con código ${vercelRes.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Error en función serverless:', error);
    console.error('Stack:', error.stack);
    if (!responseSent) {
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

// Ruta para get-sheet-data
app.all('/api/get-sheet-data', async (req, res) => {
  console.log(`\n📥 Request recibido: ${req.method} /api/get-sheet-data`);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  
  try {
    const { default: handler } = await import('./api/get-sheet-data/index.js');
    await runServerlessFunction(handler, req, res);
  } catch (error) {
    console.error('❌ Error cargando función get-sheet-data:', error);
    console.error('Stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error cargando función serverless: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Ruta para send-order
app.all('/api/send-order', async (req, res) => {
  try {
    const { default: handler } = await import('./api/send-order/index.js');
    await runServerlessFunction(handler, req, res);
  } catch (error) {
    console.error('Error cargando función send-order:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error cargando función serverless: ' + error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de funciones serverless ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   - POST/GET http://localhost:${PORT}/api/get-sheet-data`);
  console.log(`   - POST http://localhost:${PORT}/api/send-order`);
  console.log(`\n💡 Variables de entorno:`);
  console.log(`   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   - GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurada' : '❌ No configurada'}`);
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.log(`\n⚠️  Advertencia: Faltan variables de entorno. Crea un archivo .env con:`);
    console.log(`   GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com`);
    console.log(`   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`);
  }
});

