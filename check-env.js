/**
 * Script para verificar que las variables de entorno estén configuradas correctamente
 * Ejecuta: node check-env.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env
dotenv.config();

console.log('🔍 Verificando configuración de variables de entorno...\n');

const requiredVars = {
  frontend: [
    'VITE_GOOGLE_SHEET_ID',
    'VITE_USE_GOOGLE_SHEETS_API',
  ],
  server: [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
  ],
};

let allOk = true;

console.log('📋 Variables del Frontend:');
requiredVars.frontend.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${varName.includes('KEY') ? '***' : value}`);
  } else {
    console.log(`   ❌ ${varName}: No configurada`);
    allOk = false;
  }
});

console.log('\n🔐 Variables del Servidor:');
requiredVars.server.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'GOOGLE_PRIVATE_KEY') {
      const isValid = value.includes('BEGIN PRIVATE KEY') && value.includes('END PRIVATE KEY');
      console.log(`   ${isValid ? '✅' : '⚠️ '} ${varName}: ${isValid ? 'Formato válido' : 'Formato puede ser incorrecto'}`);
      if (!isValid) {
        console.log(`      💡 Asegúrate de incluir los saltos de línea como \\n`);
      }
    } else {
      console.log(`   ✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`   ❌ ${varName}: No configurada`);
    allOk = false;
  }
});

console.log('\n📝 Variables Opcionales:');
const optionalVars = [
  'VITE_SHEET_PROVIDERS',
  'VITE_SHEET_PRODUCTS',
  'VITE_API_BASE_URL',
  'VITE_FALLBACK_TO_GVIZ',
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ℹ️  ${varName}: ${value}`);
  } else {
    console.log(`   ⚪ ${varName}: No configurada (usará valores por defecto)`);
  }
});

if (allOk) {
  console.log('\n✅ Todas las variables requeridas están configuradas!');
  console.log('🚀 Puedes ejecutar: npm run dev:all');
} else {
  console.log('\n❌ Faltan variables de entorno requeridas.');
  console.log('💡 Crea un archivo .env en la raíz del proyecto con las variables necesarias.');
  console.log('📖 Consulta TESTING_LOCAL.md para más información.');
  process.exit(1);
}

