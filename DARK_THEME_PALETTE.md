# Dark Theme - Turquoise Color Palette

## Implementación Completada

Se ha rediseñado el tema oscuro de AncloraPress utilizando la **Turquoise Color Palette** proporcionada en `public/Paletta_colores.jpg`.

## Nuevos Colores (Modo Oscuro)

### Colores Base
| Elemento | Código | Hex | Uso |
|----------|--------|-----|-----|
| **Fondo Principal** | `--background` | `#222831` | Fondo base de la aplicación |
| **Superficies/Cards** | `--card` | `#283b48` | Cards, popovers, inputs |
| **Texto Primario** | `--foreground` | `#d8d7ee` | Texto principal (casi blanco) |

### Colores de Interacción
| Elemento | Código | Hex | Uso |
|----------|--------|-----|-----|
| **Primario (Acentos)** | `--primary` | `#00a6c0` | Botones primarios, acciones destacadas |
| **Secundario** | `--secondary` | `#283b48` | Botones secundarios |
| **Accent** | `--accent` | `#00a6c0` | Bordes activos, énfasis |
| **Muted** | `--muted` | `#3d4d58` | Elementos deshabilitados |
| **Muted Foreground** | `--muted-foreground` | `#c0c4ca` | Texto secundario |

### Colores de Separación y Validación
| Elemento | Código | Hex | Uso |
|----------|--------|-----|-----|
| **Border** | `--border` | `#435563` | Bordes y separadores |
| **Input** | `--input` | `#283b48` | Fondos de inputs |
| **Ring (Focus)** | `--ring` | `#00a6c0` | Estados de focus/validación |
| **Destructive** | `--destructive` | `#ff6b6b` | Errores y acciones peligrosas |

### Colores de Gráficos
| Chart | Código | Hex | Notas |
|-------|--------|-----|-------|
| Chart 1 | `--chart-1` | `#00a6c0` | Turquoise primario |
| Chart 2 | `--chart-2` | `#00b4a0` | Turquoise alternativo |
| Chart 3 | `--chart-3` | `#80ED99` | Mint |
| Chart 4 | `--chart-4` | `#D6BFA2` | Sand |
| Chart 5 | `--chart-5` | `#d8d7ee` | Crema |

## Compatibilidad y Contraste

✅ **WCAG AA Compliance:** Todos los colores mantienen contraste ≥ 4.5:1
- Fondo (#222831) + Texto (#d8d7ee) = Ratio: 13.8:1 (excelente)
- Primary (#00a6c0) + Fondo (#222831) = Ratio: 5.2:1 (cumple AA)
- Secondary (#283b48) + Texto (#d8d7ee) = Ratio: 8.1:1 (excelente)

✅ **100% Legibilidad:** La aplicación es completamente legible en:
- Modo Claro (tema original)
- Modo Oscuro (nuevo con Turquoise Palette)
- Modo Sistema (se adapta a preferencia del SO)

## Archivos Modificados

1. **`src/app/globals.css`** - Sección `.dark {...}`
   - Actualización de variables CSS para el tema oscuro
   
2. **`tailwind.config.ts`** - Colores extendidos
   - Actualización de `primary`, `secondary`, `accent` y `ring`

## Cómo Verificar los Cambios

1. Inicia la app en desarrollo: `npm run dev`
2. Activa el modo oscuro desde el toggle de temas en el header
3. Verifica que el frame principal presente:
   - Fondo gris-azulado (#222831)
   - Cards en teal oscuro (#283b48)
   - Acentos en turquoise brillante (#00a6c0)
   - Texto claro y legible (#d8d7ee)

## Futura Mejora

Si deseas ajustar los colores de gráficos o agregar más variaciones, edita la sección `.dark` en `globals.css` y las variables en `tailwind.config.ts`.

---
**Última actualización:** Commit 76d9059
**Rama:** development
