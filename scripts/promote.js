#!/usr/bin/env node

/**
 * ⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4 (JavaScript)
 * Autor: Toni Ballesteros (adaptado a JavaScript)
 * Descripción:
 *   Sincroniza todas las ramas principales (development, main, preview, production)
 *   usando como fuente la más reciente.
 *
 *   Incluye:
 *   ✅ Detección de cambios locales no comprometidos (interactiva)
 *   ✅ Protección de secretos optimizada
 *   ✅ Autocommit opcional del propio promote.js
 *   ✅ Retorno automático a la rama original
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================
// 🎨 UTILIDADES DE COLOR
// ============================
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  darkGreen: '\x1b[90m\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  darkGray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.darkGray}${msg}${colors.reset}`),
};

// ============================
// 🔧 CONFIGURACIÓN INICIAL
// ============================
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const logsDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logsDir, `promote_${timestamp}.txt`);

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Crear un stream para logging
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const logToFile = (msg) => {
  logStream.write(`${msg}\n`);
};

// ============================
// 🧠 EJECUCIÓN DE COMANDOS GIT
// ============================
const runGit = (args, options = {}) => {
  try {
    const cmd = `git ${args}`;
    const result = execSync(cmd, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Git error: ${error.message}`);
  }
};

// ============================
// 📋 LECTURA DE INPUT INTERACTIVO
// ============================
const askQuestion = (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toUpperCase());
    });
  });
};

// ============================
// 🚀 FUNCIÓN PRINCIPAL
// ============================
async function promote() {
  console.log(`\n${colors.cyan}⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4 (JavaScript)\n${colors.reset}`);
  logToFile(`\n⚓ ANCLORA DEV SHELL — PROMOTE FULL v3.4\nIniciado: ${new Date().toISOString()}\n`);

  let usedStash = false;

  try {
    // ============================
    // 🧩 AUTORIZACIÓN SEGURA
    // ============================
    log.info('🧩 Verificando configuración de Git...');
    let gitUserName = '';
    let gitUserEmail = '';

    try {
      gitUserName = runGit('config user.name').trim();
      gitUserEmail = runGit('config user.email').trim();
    } catch (e) {
      log.warn('No se pudo obtener configuración de Git. Usando valores por defecto...');
      gitUserName = 'Anonymous';
      gitUserEmail = 'dev@anclora.local';
    }

    log.success(`Autorización verificada: ${gitUserName} <${gitUserEmail}>\n`);
    logToFile(`Usuario Git: ${gitUserName} <${gitUserEmail}>\n`);

    // ============================
    // 🧠 AUTODETECCIÓN DE CAMBIOS EN EL PROPIO SCRIPT
    // ============================
    const scriptPath = 'scripts/promote.js';
    try {
      const status = runGit(`status --porcelain ${scriptPath}`);
      if (status.includes('M')) {
        log.warn('Se detectaron cambios sin commit en promote.js.');
        const resp = await askQuestion('¿Deseas hacer commit automático? (S/N): ');
        if (resp === 'S') {
          runGit(`add ${scriptPath}`);
          runGit('commit -m "🔄 promote.js actualizado automáticamente (v3.4)"');
          runGit('push origin HEAD');
          log.success('promote.js actualizado y sincronizado correctamente.\n');
          logToFile('promote.js actualizado y sincronizado.\n');
        } else {
          log.debug('Se omite la sincronización del propio script.\n');
        }
      }
    } catch (e) {
      log.debug('Sin cambios en promote.js\n');
    }

    // ============================
    // 🧾 VERIFICACIÓN DE ESTADO GIT (INTERACTIVA)
    // ============================
    log.info('🧩 Comprobando estado de cambios locales...');
    let changes = '';
    try {
      changes = runGit('status --porcelain');
      changes = changes
        .split('\n')
        .filter(
          (line) =>
            line.trim() &&
            !line.includes('scripts/') &&
            !line.includes('logs/')
        )
        .join('\n');
    } catch (e) {
      changes = '';
    }

    if (changes) {
      log.warn('\nSe detectaron cambios sin commit fuera de logs/ y scripts/:');
      changes.split('\n').forEach((line) => {
        if (line.trim()) log.debug(`   ${line}`);
      });

      console.log('');
      console.log(`${colors.cyan}Opciones disponibles:${colors.reset}`);
      console.log('  [C] Commit automático de los cambios');
      console.log('  [S] Stash temporal y continuar');
      console.log(`  [N] Cancelar ejecución${colors.reset}`);

      const choice = await askQuestion('Selecciona una opción (C/S/N): ');

      switch (choice) {
        case 'C':
          log.warn('💾 Realizando commit automático...');
          runGit('add -A');
          runGit('commit -m "💾 Commit automático previo a promote.js"');
          log.success('Cambios confirmados localmente.\n');
          logToFile('Cambios confirmados con commit automático.\n');
          break;
        case 'S':
          log.warn('📦 Guardando cambios en stash temporal...');
          runGit('stash push -m "Stash temporal antes de promote.js"');
          usedStash = true;
          log.success('Cambios guardados temporalmente.\n');
          logToFile('Cambios guardados en stash.\n');
          break;
        default:
          log.error('Operación cancelada por el usuario.');
          logToFile('Operación cancelada por usuario.\n');
          logStream.end();
          process.exit(0);
      }
    }

    // ============================
    // 🔐 PROTECCIÓN DE SECRETOS (OPTIMIZADA)
    // ============================
    log.warn('🔐 Aplicando protección de secretos optimizada...');
    const protectedPatterns = ['.env.local', '.env', '.env.*.local', '.db'];
    const protectedDirs = ['.', 'db'];

    protectedDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        try {
          fs.readdirSync(dir).forEach((file) => {
            const fullPath = path.join(dir, file);
            const isFile = fs.statSync(fullPath).isFile();

            if (
              isFile &&
              protectedPatterns.some((pattern) => {
                if (pattern.includes('*')) {
                  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                  return regex.test(file);
                }
                return file === pattern;
              })
            ) {
              try {
                runGit(`update-index --assume-unchanged ${fullPath}`);
                log.debug(`🧱 Protegido: ${fullPath}`);
                logToFile(`Protegido: ${fullPath}`);
              } catch (e) {
                // Ignorar si ya está protegido
              }
            }
          });
        } catch (e) {
          // Ignorar directorios inaccesibles
        }
      }
    });

    // ============================
    // 🕒 SINCRONIZACIÓN DE RAMAS
    // ============================
    const branches = ['development', 'main', 'preview', 'production'];
    const currentBranch = runGit('rev-parse --abbrev-ref HEAD');

    log.info(`\n📍 Rama actual detectada: ${currentBranch}\n`);
    log.warn('🔄 Actualizando referencias remotas...');
    runGit('fetch --all --prune');

    // Detectar la más reciente
    let latest = null;
    const branchDates = [];

    branches.forEach((branch) => {
      try {
        const commitTimestamp = runGit(`log -1 --format=%ct ${branch}`);
        if (commitTimestamp) {
          branchDates.push({
            name: branch,
            timestamp: parseInt(commitTimestamp),
          });
        }
      } catch (e) {
        // Rama no existe localmente
      }
    });

    if (branchDates.length === 0) {
      log.error('No se detectaron ramas válidas. Abortando...');
      logToFile('Error: No se detectaron ramas válidas.\n');
      logStream.end();
      process.exit(1);
    }

    latest = branchDates.sort((a, b) => b.timestamp - a.timestamp)[0];
    const latestDate = new Date(latest.timestamp * 1000).toLocaleString('es-ES');

    log.info(`📍 Rama más reciente detectada: ${latest.name} (${latestDate})\n`);
    logToFile(`Rama más reciente: ${latest.name} (${latestDate})\n`);

    // ============================
    // 🔁 PROCESAR CADA RAMA
    // ============================
    for (const branch of branches) {
      log.info(`📦 Procesando rama '${branch}'...`);
      logToFile(`\nProcesando rama: ${branch}`);

      try {
        runGit(`checkout ${branch}`);
        runGit(`pull origin ${branch} --rebase`);

        if (branch !== latest.name) {
          log.warn(`🪄 Rebasando sobre '${latest.name}'...`);
          runGit(`rebase ${latest.name}`);
          log.success(`Rebase completado: ${branch} ← ${latest.name}`);
          logToFile(`Rebase completado: ${branch} ← ${latest.name}`);
        }

        runGit(`push origin ${branch} --force-with-lease`);
        log.debug(`⬆️ Push completado para '${branch}'\n`);
        logToFile(`Push completado para ${branch}`);
      } catch (error) {
        log.error(`Error en la rama '${branch}': ${error.message}`);
        logToFile(`Error en rama ${branch}: ${error.message}`);
      }
    }

    // ============================
    // 🧹 LIMPIEZA Y RESTAURACIÓN FINAL
    // ============================
    if (usedStash) {
      log.warn('📦 Restaurando cambios del stash...');
      runGit('stash pop');
      log.success('Cambios restaurados correctamente.\n');
      logToFile('Cambios restaurados del stash.\n');
    }

    runGit(`checkout ${currentBranch}`);
    log.info(`\n🔁 Has vuelto a tu rama original: ${currentBranch}`);
    log.success(
      '🎯 Todas las ramas sincronizadas correctamente (rebase limpio aplicado).'
    );
    log.warn(`🕒 Finalizado: ${new Date().toLocaleTimeString('es-ES')}`);
    log.debug(`\n📁 Log guardado en: ${logFile}`);

    logToFile(`\nFinalizado: ${new Date().toISOString()}`);
    logStream.end();

    console.log('');
  } catch (error) {
    log.error(`❌ Error durante la sincronización: ${error.message}`);
    logToFile(`\nError: ${error.message}`);
    logStream.end();
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  promote();
}

module.exports = { promote };
