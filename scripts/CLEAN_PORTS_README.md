# 🧹 Clean Ports Script - Anclora Press

## Descripción

Script batch que automatiza la detección y limpieza de puertos usados por Anclora Press.

### Puertos Monitoreados

- **Puerto 3000** - Servidor de desarrollo Next.js (principal)
- **Puerto 81** - Caddy reverse proxy (opcional)

---

## 🚀 Uso

### Opción 1: Ejecutar directamente el script

```bash
scripts/clean-ports.bat
```

O desde PowerShell:

```powershell
.\scripts\clean-ports.bat
```

### Opción 2: Usar npm scripts (Recomendado)

```bash
# Solo limpiar puertos
npm run clean-ports

# Limpiar puertos Y arrancar servidor de desarrollo
npm run dev:clean
```

---

## 📋 Qué hace el script

1. **Verifica** si el puerto 3000 está en uso
2. **Verifica** si el puerto 81 está en uso
3. Si encuentra procesos activos:
   - Obtiene el PID (Process ID) del proceso
   - Muestra un mensaje indicando el puerto y PID
   - **Detiene el proceso** automáticamente con `taskkill`
4. Espera 2 segundos para que los cambios se apliquen
5. Muestra un resumen final

---

## 📊 Ejemplo de salida

```
========================================
 Anclora Press - Limpieza de Puertos
========================================

Verificando puerto 3000...
   [!] Proceso encontrado en puerto 3000 - PID: 12345
   Deteniendo proceso...
   [✓] Proceso 12345 terminado

Verificando puerto 81...
   [✓] Puerto 81 disponible

========================================
 [✓] Limpieza completada
 Ahora puedes ejecutar: npm run dev
========================================
```

---

## ⚙️ Requisitos

- **Windows** (el script usa `netstat` y `taskkill`, comandos nativos de Windows)
- **Permisos de administrador** (requerido para terminar procesos)
- **Node.js/npm** instalado (si usas `npm run clean-ports`)

---

## 🔧 Cómo funciona técnicamente

El script utiliza:

1. **`netstat -ano`** - Lista todas las conexiones activas en el sistema
2. **`findstr ":puerto"`** - Filtra por puerto específico
3. **`taskkill /PID`** - Termina el proceso usando su ID
   - `/F` = Force (fuerza terminación)
   - `/T` = Tree (termina procesos hijos también)

---

## ⚠️ Importante

- **El script terminará cualquier proceso en esos puertos**, no solo servidores Node.js
- Si ejecutas desde terminal sin permisos de administrador, algunos procesos podrían no terminarse correctamente
- Si tienes otros servicios en puerto 81 (como Apache, IIS, etc.), **¡NO USES ESTE SCRIPT!** Edítalo primero para evitar terminar esos servicios

---

## 🛠️ Personalizar puertos

Si necesitas modificar los puertos:

### Editar el script directamente

Abre `scripts/clean-ports.bat` y cambia esta línea:

```batch
set "ports=3000 81"
```

Por ejemplo, si solo quieres monitorear puerto 3000:

```batch
set "ports=3000"
```

O si necesitas más puertos:

```batch
set "ports=3000 81 5000 8080"
```

---

## 📝 Casos de uso

### Caso 1: Servidor anterior no se cerró correctamente

```bash
npm run dev:clean
# Limpia puertos y arranca servidor automáticamente
```

### Caso 2: Necesitas liberar puerto 3000 manualmente

```bash
npm run clean-ports
# Luego ejecuta lo que necesites
```

### Caso 3: Diagnóstico rápido

```bash
npm run clean-ports
# Verifica si hay procesos activos en esos puertos
```

---

## 🐛 Troubleshooting

### "Access Denied" al ejecutar

**Solución:** Ejecuta PowerShell o CMD como administrador antes de ejecutar el script.

### El puerto sigue en uso después de ejecutar

**Solución:**
1. Verifica que el proceso se terminó: `netstat -ano | findstr ":3000"`
2. Si aún aparece, ejecuta con permisos elevados
3. Espera unos segundos, a veces toma un momento liberar el puerto

### El script no encuentra netstat

**Solución:** `netstat` debería estar en `%systemroot%\System32`. Si no está disponible:
1. Verifica que estés en Windows
2. Reinicia tu terminal
3. Ejecuta como administrador

---

## 📚 Notas

- El script es seguro de ejecutar múltiples veces
- Usa `2>nul` para suprimir errores si el puerto no está en uso
- Usa `setlocal enabledelayedexpansion` para variables dinámicas dentro de loops
- El timeout de 2 segundos permite que Windows complete la liberación del puerto

---

**Última actualización:** 13 Dic 2025
**Versión:** 1.0
**Compatible:** Windows 7+
