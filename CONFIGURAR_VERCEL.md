# 🔧 Configurar Variables de Entorno en Vercel

## Error Actual
```
Error: Faltan credenciales de cuenta de servicio. 
Configura GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY
```

## Solución: Configurar Variables en Vercel

### Paso 1: Acceder a Vercel Dashboard
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto (el que está desplegado en mardevina.cl)

### Paso 2: Ir a Environment Variables
1. Haz clic en **Settings**
2. En el menú lateral, haz clic en **Environment Variables**

### Paso 3: Agregar Variables del Servidor (CRÍTICAS)

Estas variables se usan en las funciones serverless:

#### Variable 1: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- **Key:** `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- **Value:** `nexommarvina@nexom-ai-473614.iam.gserviceaccount.com`
- **Environment:** Selecciona ✅ Production y ✅ Preview

#### Variable 2: `GOOGLE_PRIVATE_KEY`
- **Key:** `GOOGLE_PRIVATE_KEY`
- **Value:** Copia el valor completo del campo `private_key` del archivo JSON de credenciales
  - Debe incluir `-----BEGIN PRIVATE KEY-----` al inicio
  - Debe incluir `-----END PRIVATE KEY-----` al final
  - Los saltos de línea deben ser `\n` (no saltos reales)
  - Debe estar entre comillas dobles: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
- **Environment:** Selecciona ✅ Production y ✅ Preview

**Ejemplo de formato correcto:**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Paso 4: Agregar Variables del Frontend

Estas variables se usan durante el build:

#### Variable 3: `VITE_GOOGLE_SHEET_ID`
- **Key:** `VITE_GOOGLE_SHEET_ID`
- **Value:** Tu sheet ID (ej: `1fHgLAmAdDydZ7-xH4URAnQoSXiMzkn5ugvMSU_ciRYU`)
- **Environment:** Selecciona ✅ Production y ✅ Preview

#### Variable 4: `VITE_USE_GOOGLE_SHEETS_API`
- **Key:** `VITE_USE_GOOGLE_SHEETS_API`
- **Value:** `true`
- **Environment:** Selecciona ✅ Production y ✅ Preview

### Paso 5: Hacer un Nuevo Deployment

Después de agregar las variables:

1. Ve a la pestaña **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push a GitHub

## ⚠️ Importante sobre GOOGLE_PRIVATE_KEY

El formato es crítico. Debes copiar el valor exacto del archivo JSON:

1. Abre el archivo JSON de credenciales que descargaste de Google Cloud
2. Busca el campo `"private_key"`
3. Copia TODO el valor (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
4. En Vercel, pega el valor y asegúrate de que:
   - Los saltos de línea sean `\n` (no saltos reales)
   - Esté entre comillas dobles

## Verificación

Después de configurar y hacer redeploy:

1. Espera a que termine el deployment
2. Abre https://mardevina.cl
3. Verifica que los datos se carguen correctamente
4. Si aún hay errores, revisa los logs:
   - Vercel Dashboard → Functions → `/api/get-sheet-data` → Logs

## Troubleshooting

### Error persiste después de configurar variables
- Verifica que las variables estén configuradas para **Production**
- Asegúrate de haber hecho un **redeploy** después de agregar las variables
- Revisa los logs de la función en Vercel para ver errores específicos

### Error de formato en GOOGLE_PRIVATE_KEY
- Asegúrate de que los saltos de línea sean `\n` (no saltos reales)
- Verifica que esté entre comillas dobles
- Copia el valor exacto del archivo JSON

