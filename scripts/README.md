# 🔧 Scripts de Anclora Press

Colección de scripts útiles para automatizar tareas de desarrollo y deployment.

## 📦 promote.js / promote.bat / promote.ps1

Script de sincronización de ramas para mantener todas las ramas principales actualizadas.

### ¿Qué hace?

Sincroniza automáticamente las siguientes ramas:
- `development` (rama de desarrollo)
- `main` (rama principal)
- `preview` (rama de previsualización)
- `production` (rama de producción)

El script:
1. ✅ Detecta cambios locales no comprometidos
2. ✅ Protege archivos sensibles (.env, .db)
3. ✅ Encuentra la rama más reciente
4. ✅ Rebasa todas las ramas sobre la más reciente
5. ✅ Hace push con `--force-with-lease`
6. ✅ Retorna automáticamente a la rama original

### 📋 Requisitos

- Git instalado y configurado
- Node.js (para `promote.js`)
- PowerShell (para `promote.ps1` en Windows)

### 🚀 Ejecución

**Opción 1: Usando npm (Recomendado)**
```bash
npm run promote
```

**Opción 2: Script JavaScript directo**
```bash
node scripts/promote.js
```

**Opción 3: Script Batch (Windows)**
```cmd
scripts\promote.bat
```

**Opción 4: Script PowerShell (Windows)**
```powershell
.\scripts\promote.ps1
```

### 🎯 Flujo de ejecución

1. **Verificación de Git**: Comprueba configuración de usuario
2. **Detección de cambios en promote.js**: Pregunta si quieres actualizar el script
3. **Análisis de estado**: Detecta cambios locales sin commit
   - **[C]** Commit automático
   - **[S]** Stash temporal
   - **[N]** Cancelar operación
4. **Protección de secretos**: Marca `.env*` y `.db` como ignorados
5. **Sincronización**: Rebasa todas las ramas
6. **Restauración**: Vuelve a la rama original

### 📁 Logs

Los logs de cada ejecución se guardan en:
```
logs/promote_YYYY-MM-DD_HH-MM-SS.txt
```

### ⚠️ Notas importantes

- El script usa `--force-with-lease` para rebaseos seguros
- Los cambios locales no comprometidos se pueden guardar en stash
- La protección de secretos es automática (no necesita configuración)
- Todos los logs se registran en la carpeta `logs/`

### 🔐 Archivos protegidos

Estos archivos nunca se sincronizarán entre ramas:
- `.env.local`
- `.env`
- `.env.*.local`
- `.db` y archivos de BD

### 💡 Consejos

1. **Antes de ejecutar**: Asegúrate de estar en una rama limpia o haz commit
2. **Stash automático**: Si tienes cambios, el script puede guardarlos temporalmente
3. **Sin conflictos**: El rebase solo afecta a ramas, no a tu trabajo local
4. **Registros**: Revisa `logs/` si hay problemas

### 🐛 Solución de problemas

**Error: "No se detectaron ramas válidas"**
- Asegúrate de que todas las ramas existen localmente
- Ejecuta `git fetch --all` manualmente

**Error: "Git no está configurado"**
- Ejecuta: `git config --global user.name "Tu Nombre"`
- Ejecuta: `git config --global user.email "tu@email.com"`

**Conflictos de rebase**
- El script se detendrá. Resuelve los conflictos manualmente con `git rebase --continue`

---

## 📝 Formato de logs

Los logs incluyen:
- Timestamp de inicio y fin
- Usuario de Git utilizado
- Cambios detectados
- Operaciones realizadas
- Ramas sincronizadas
- Errores (si los hay)

Ejemplo:
```
⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4
Iniciado: 2024-12-13T00:15:30.000Z

Usuario Git: ToniIAPro73 <supertoniia@gmail.com>

Rama más reciente: development (13/12/2024 00:14:05)

Procesando rama: development
Procesando rama: main
  Rebase completado: main ← development
  Push completado para main

Finalizado: 2024-12-13T00:15:45.123Z
```
