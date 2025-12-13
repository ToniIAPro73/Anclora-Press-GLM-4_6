# MVP Strategy Summary
## Anclora Press: Word → PDF Perfect Fidelity

**Documento de Síntesis Estratégica**
**Preparado:** Diciembre 13, 2025

---

## El Insight Central

**Problema:** Atticus (principal competidor) ha comprometido su estabilidad técnica priorizar:
- Corrupción de datos en sincronización
- Brecha WYSIWYG (previsualización ≠ PDF impreso)
- Performance lenta con documentos grandes

**Oportunidad:** Anclora puede capturar cuota de mercado resolviendo los fallos arquitectónicos de Atticus mediante una arquitectura "Local-First" + "Unified Rendering Engine" (Paged.js).

**Ventaja Defensible:**
- Tiptap: Edición semántica (vs. Atticus string-based)
- Paged.js: CSS estándar W3C (vs. backend proprietary PDFs)
- IndexedDB: Verdad local (vs. sincronización frágil)
- Mammoth.js: Mapeo semántico (vs. HTML sucia)

---

## El MVP en 3 Líneas

1. **Entrada:** Usuario carga documento .DOCX complejo
2. **Proceso:** Sistema lo importa semánticamente, permite edición en UI minimalista, renderiza previsualización perfecta en Paged.js
3. **Salida:** PDF que es 100% idéntico a lo que vio en pantalla (resuelve el "Terror" de Atticus)

---

## Diferenciador vs. Competencia

| Aspecto | Vellum | Atticus | Anclora MVP |
|--------|--------|---------|------------|
| **Plataforma** | macOS solo | Web (inestable) | Web (Local-First) |
| **Motor PDF** | Quartz native | Backend (?) | Paged.js (cliente) |
| **WYSIWYG** | Sí (nativo) | ❌ Broken | ✅ CSS estándar |
| **Datos** | Local | Cloud (falla) | Local + cloud |
| **Costo** | $249 | $147 | $0-49 |
| **Personalización** | Limitada | Alta | Alta (CSS vars) |

---

## Cronograma Realista

```
Semana 1 (Dec 13):  Seguridad + Setup
Semana 2 (Dec 20):  Tiptap + Paged.js
Semana 3 (Dec 27):  PDF Export + Local Storage
Semana 4 (Jan 3):   Testing + Beta Users

MVP LISTO: 4 de enero, 2026
```

---

## Equipos y Responsabilidades

**Si eres full-stack:**
- Semana 1: Security + API improvements
- Semana 2-3: Todo en paralelo (frontend + backend)
- Semana 4: Testing y optimización

**Prioridad Técnica:**
1. Security (no negociable)
2. Mammoth.js integration (parsing robusto)
3. Paged.js (el diferenciador)
4. IndexedDB (confiabilidad)
5. Tiptap (experiencia de usuario)

---

## Instalaciones Necesarias (15 min)

```bash
# Core
npm install @tiptap/react @tiptap/pm @tiptap/extension-*
npm install pagedjs
npm install idb

# Verificar
npm run build
npm run dev
```

---

## Métricas de Éxito (MVP)

- ✅ DOCX importa en <5 segundos
- ✅ PDF exportado = Previsualización pixel-perfecto
- ✅ Zero data loss offline
- ✅ 3-5 usuarios beta satisfechos
- ✅ Listo para Early Access

---

## Riesgo Principal Identificado

**El rendimiento con documentos largos (500+ páginas)**
- Solución: Virtualización de listados + lazy loading capítulos
- Impacto: Puede afectar Fase 2, no MVP

---

## Recomendación Inmediata

**COMIENZA AHORA CON:**

1. Phase 0.1: Seguridad en `/api/import`
   - Toma 6-8 horas
   - Es bloqueante para cualquier beta testing
   - Protege contra ataques de inyección

2. Instalar dependencias Tiptap + Paged.js en paralelo

3. Para Viernes (Dic 20): Tener un importador DOCX → Editor Tiptap → Preview Paged.js funcional

---

## Ventaja Psicológica

Los autores aman las herramientas que:
1. **No pierden su trabajo** ← Esto es Anclora (Local-First)
2. **Lo que ven es lo que imprimen** ← Esto es Paged.js
3. **Funcionan sin tecnicismos** ← Esto es Tiptap UI minimalista

Atticus falló en #1 y #2. Anclora lo soluciona.

---

**Aprobación requerida para proceder con Phase 0.**
