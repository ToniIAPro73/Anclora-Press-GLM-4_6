#!/bin/bash

# =================================================================
# Script de Pruebas de Validación y Funcionalidad (Fases 1 y 2)
# =================================================================

# -----------------------------------------------------------------
# FASE 1: VALIDACIÓN (Compilación y Arranque)
# -----------------------------------------------------------------

echo "--- FASE 1: VALIDACIÓN (Compilación y Arranque) ---"

# 1. Instalar dependencias (si no se hizo antes)
echo "1. Instalando dependencias (npm install)..."
cd /home/ubuntu/anclora-press-repo
npm install

# 2. Verificar que no hay errores de TypeScript
echo "2. Verificando errores de TypeScript (npm run build)..."
npm run build

# 3. Iniciar el servidor de desarrollo
echo "3. Iniciando el servidor de desarrollo (npm run dev)..."
# Usamos 'start' para simular el entorno de producción (Next.js standalone)
# y 'exec' para ejecutarlo en segundo plano
npm run start &
SERVER_PID=$!
echo "Servidor iniciado con PID: $SERVER_PID"

# 4. Exponer el puerto 3000 para acceso externo (simulación)
echo "4. Exponiendo el puerto 3000..."
# Nota: En un entorno real, se usaría 'expose' para obtener la URL.
# Aquí solo se documenta el paso.

echo "--- FASE 1 COMPLETADA ---"
echo "El servidor está corriendo. Para la validación visual, se requiere acceso al navegador."
echo "URL de acceso (simulada): http://localhost:3000"
echo "Para detener el servidor: kill $SERVER_PID"

# -----------------------------------------------------------------
# FASE 2: PRUEBAS DE FUNCIONALIDAD (Importación de Documentos)
# -----------------------------------------------------------------

echo "--- FASE 2: PRUEBAS DE FUNCIONALIDAD (Importación) ---"

# Nota: La prueba de importación requiere un entorno de Next.js en ejecución
# y archivos de prueba. Asumiremos que los archivos de prueba están en /home/ubuntu/test_docs.

# 1. Crear directorio de documentos de prueba (simulación)
echo "1. Creando directorio de documentos de prueba..."
mkdir -p /home/ubuntu/test_docs

# 2. Crear archivos de prueba (simulación de documentos)
echo "2. Creando archivos de prueba (DOCX, PDF, MD)..."
# Simulación de DOCX (requiere un archivo real para prueba completa)
echo "Contenido de prueba DOCX" > /home/ubuntu/test_docs/test_simple.docx
# Simulación de PDF (requiere un archivo real para prueba completa)
echo "Contenido de prueba PDF" > /home/ubuntu/test_docs/test_structured.pdf
# Archivo Markdown estructurado (para probar la importación MD)
cat > /home/ubuntu/test_docs/test_structured.md << 'MARKDOWN_EOF'
# Capítulo 1: Introducción
## Sección 1.1: El Comienzo
- Punto 1
- Punto 2
> Esto es una cita importante.
MARKDOWN_EOF

# 3. Simulación de Prueba de Importación (requiere interacción manual o un script de prueba real)
echo "3. Simulación de Prueba de Importación (requiere interacción manual):"
echo "   - Acceder a la aplicación en el navegador (http://localhost:3000)."
echo "   - Navegar a la sección de 'Importación de Documentos'."
echo "   - Subir los archivos de prueba (test_simple.docx, test_structured.pdf, test_structured.md)."
echo "   - Verificar que el contenido se importa correctamente, incluyendo encabezados, listas y citas."

echo "--- FASE 2 COMPLETADA (Preparación de Entorno) ---"
echo "La ejecución de las pruebas de importación requiere interacción manual en la interfaz de usuario."

# -----------------------------------------------------------------
# Instrucciones de Limpieza
# -----------------------------------------------------------------
echo "Para limpiar el entorno:"
echo "kill $SERVER_PID"
echo "rm -rf /home/ubuntu/test_docs"

