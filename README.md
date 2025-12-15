# Anclora Press

**Tu productividad, bien anclada** - Plataforma de Publishing Digital Profesional

Anclora Press es una aplicación web moderna y completa para la creación, edición y publicación de libros digitales. Diseñada con tecnologías de última generación, ofrece una experiencia intuitiva tanto para autores principiantes como para profesionales del sector editorial.

## 🌟 Características Principales

### 📝 Editor Avanzado

- **Editor de texto enriquecido** con soporte para Markdown y MDX
- **Editor básico y avanzado** para diferentes niveles de usuarios
- **Importación de documentos** en múltiples formatos (TXT, MD, PDF, DOCX, RTF, ODT, EPUB)
- Conversión automática con Pandoc

### 📖 Gestión de Contenido

- **Organización de capítulos** con arrastrar y soltar (Drag & Drop)
- **Estructura visual** de tu libro
- **Edición colaborativa** en tiempo real
- **Versionado** de cambios

### 🎨 Diseño Profesional

- **Galería de plantillas** prediseñadas
- **Editor visual de portada** con personalización de colores e imágenes
- **Diseño de contraportada** con reseñas y información del autor
- **Paleta de colores Turquesa** - marca visual moderna y profesional
- **Modo oscuro y claro** con máxima legibilidad WCAG AA

### 👥 Colaboración

- **Panel de colaboración** en tiempo real
- **Sistema de comentarios** para revisión
- **Seguimiento de versiones** del documento
- **Gestión de permisos** (propietario, editor, comentarista)

### 🤖 Asistencia con IA

- **Sugerencias de estilo** para mejorar el contenido
- **Generación de portadas** con IA
- **Reescritura de textos** inteligente

### 📊 Vista Previa y Exportación

- **Vista previa de página simple y doble**
- **Control de zoom** dinámico
- **Exportación en múltiples formatos**:
  - PDF (optimizado para impresión)
  - EPUB (estándar para ebooks)
  - Y más formatos por venir

### 🌐 Multiidioma

- **Soporte completo para español e inglés**
- Interfaz totalmente traducida
- Cambio dinámico de idioma sin recargar

## 🛠️ Stack Tecnológico

### Frontend

- **Next.js 15.3.5** - Framework React con App Router
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Estilos utilitarios
- **shadcn/ui** - Componentes accesibles (50+)
- **Framer Motion** - Animaciones fluidas
- **React Hook Form + Zod** - Formularios validados

### Backend & Datos

- **Prisma ORM** - Gestión de base de datos
- **SQLite** - Base de datos ligera
- **Next.js API Routes** - Endpoints backend
- **TanStack Query v5** - Caché y sincronización
- **Axios** - Cliente HTTP

### Edición & Documentos

- **MDXEditor v3.39.1** - Editor enriquecido
- **Pandoc** - Conversión de documentos
- **React Markdown** - Renderizado de markdown
- **Sharp** - Procesamiento de imágenes

### Integraciones

- **Next Auth v4** - Autenticación
- **Next Intl** - Internacionalización
- **DND Kit** - Drag & Drop
- **Recharts** - Gráficos
- **Lucide React** - Iconografía

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Pandoc instalado en el sistema

## 🚀 Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <https://github.com/usuario/anclora-press.git>
cd anclora-press
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno

Crea un archivo \`.env.local\` en la raíz del proyecto:
\`\`\`env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="<http://localhost:3000>"
NEXTAUTH_SECRET="tu-clave-secreta-aquí"
\`\`\`

### 4. Inicializar la base de datos

\`\`\`bash
npm run db:push
\`\`\`

### 5. Iniciar el servidor de desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en \`<http://localhost:3000\`>

## 📱 Uso

### Flujo de Trabajo Principal

1. **Contenido** - Escribe o importa tu contenido
2. **Capítulos** - Organiza tu libro en capítulos
3. **Plantilla** - Elige el diseño visual
4. **Portada** - Diseña tu portada
5. **Contraportada** - Añade información y reseñas
6. **Vista Previa** - Revisa tu libro completo
7. **Colaboración** - Trabaja con otros usuarios
8. **IA** - Mejora tu contenido con asistencia
9. **Exportar** - Publica en múltiples formatos

## 🔧 Comandos Disponibles

### Desarrollo

\`\`\`bash
npm run dev # Iniciar servidor de desarrollo
npm run dev:clean # Limpiar puertos y start dev
npm run lint # Ejecutar ESLint
\`\`\`

### Base de Datos

\`\`\`bash
npm run db:push # Sincronizar schema con BD
npm run db:generate # Generar cliente Prisma
npm run db:migrate # Ejecutar migraciones
npm run db:reset # Resetear BD y re-sembrar
\`\`\`

### Producción

\`\`\`bash
npm run build # Compilar para producción
npm start # Iniciar servidor de producción
\`\`\`

### Utilidades

\`\`\`bash
npm run clean-ports # Limpiar puertos 3000 y 81
npm run promote # Sincronizar branches (dev → main)
\`\`\`

## 🎨 Sistema de Diseño

### Paleta de Colores

- **Azul Profundo**: #00253F
- **Turquesa Oscuro**: #005872
- **Turquesa Vivido**: #00B4A0
- **Menta**: #80ED99
- **Arena**: #D6BFA2

### Tipografía

- **Serif**: Libre Baskerville (títulos)
- **Sans**: Inter (cuerpo)
- **Mono**: JetBrains Mono (código)

## 🌐 Internacionalización

Anclora Press soporta completamente español e inglés. El sistema de traducción está centralizado en \`src/hooks/use-language.ts\`.

## 🔐 Licencia

Este proyecto está bajo la licencia MIT. Consulta [LICENSE.es.md](LICENSE.es.md).

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor abre un Pull Request.

## 📧 Contacto

Para preguntas o sugerencias, contacta a través de las issues del repositorio.

---

**Desarrollado con ❤️ para autores y editores profesionales**
