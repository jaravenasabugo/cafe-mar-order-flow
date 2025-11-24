/**
 * Script de prueba rápida para verificar que el endpoint funciona localmente
 * Ejecuta: node test-api-local.js
 * 
 * Asegúrate de tener configuradas las variables de entorno antes de ejecutar
 */

const SHEET_ID = process.env.VITE_GOOGLE_SHEET_ID || 'tu_sheet_id_aqui';
const SHEET_NAME = process.env.VITE_SHEET_PROVIDERS || 'Provveedores';
const API_URL = 'http://localhost:3001/api/get-sheet-data';

async function testAPI() {
  console.log('🧪 Probando endpoint de Google Sheets...\n');
  console.log(`📊 Sheet ID: ${SHEET_ID}`);
  console.log(`📄 Sheet Name: ${SHEET_NAME}`);
  console.log(`🔗 URL: ${API_URL}\n`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: SHEET_ID,
        sheetName: SHEET_NAME,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error || data);
      if (data.details) {
        console.error('\nDetalles:', data.details);
      }
      process.exit(1);
    }

    console.log('✅ Éxito!');
    console.log(`📈 Filas obtenidas: ${data.rows?.length || 0}\n`);

    if (data.rows && data.rows.length > 0) {
      console.log('📋 Primeras 3 filas:');
      data.rows.slice(0, 3).forEach((row, index) => {
        console.log(`\nFila ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('⚠️  No se obtuvieron filas. Verifica que la hoja tenga datos.');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\n💡 Asegúrate de que el servidor esté ejecutándose:');
    console.error('   npm run dev:serverless');
    process.exit(1);
  }
}

testAPI();

