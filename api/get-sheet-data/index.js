/**
 * Vercel Serverless Function para acceder a Google Sheets usando la API oficial
 * con autenticación mediante cuenta de servicio.
 * 
 * Requiere:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Email de la cuenta de servicio
 * - GOOGLE_PRIVATE_KEY: Clave privada de la cuenta de servicio (formato JSON string)
 * - GOOGLE_SHEET_ID: ID de la hoja de cálculo (opcional, puede venir en el request)
 */

import { google } from 'googleapis';

export default async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Obtener parámetros del request
    const { sheetId, sheetName } = req.method === 'GET' 
      ? req.query 
      : req.body;

    if (!sheetId || !sheetName) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: sheetId y sheetName' 
      });
    }

    // Obtener credenciales de la cuenta de servicio desde variables de entorno
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    // Logging para depuración (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verificando credenciales:');
      console.log(`   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail ? '✅ (' + serviceAccountEmail.substring(0, 20) + '...)' : '❌ No configurada'}`);
      console.log(`   - GOOGLE_PRIVATE_KEY: ${privateKey ? '✅ (' + privateKey.substring(0, 30) + '...)' : '❌ No configurada'}`);
    }
    
    if (!serviceAccountEmail || !privateKey) {
      return res.status(500).json({ 
        error: 'Faltan credenciales de cuenta de servicio. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY',
        debug: process.env.NODE_ENV === 'development' ? {
          hasEmail: !!serviceAccountEmail,
          hasKey: !!privateKey,
          envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
        } : undefined
      });
    }

    // Configurar autenticación con cuenta de servicio
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Crear cliente de Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener los datos de la hoja
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return res.status(200).json({ rows: [] });
    }

    // Convertir filas a objetos usando la primera fila como encabezados
    const headers = rows[0].map((h) => String(h || '').trim());
    const dataRows = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        const value = row[index];
        // Intentar convertir números y fechas
        if (value === undefined || value === null || value === '') {
          obj[header] = null;
        } else if (!isNaN(value) && value !== '') {
          // Es un número
          obj[header] = Number(value);
        } else {
          // Es texto
          obj[header] = String(value).trim();
        }
      });
      return obj;
    });

    return res.status(200).json({ rows: dataRows });

  } catch (err) {
    console.error('Error al acceder a Google Sheets:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const statusCode = err.code === 404 ? 404 : err.code === 403 ? 403 : 500;
    
    return res.status(statusCode).json({ 
      error: `Error al acceder a Google Sheets: ${message}`,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

