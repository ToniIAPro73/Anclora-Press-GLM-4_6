# Anclora Press

**Your productivity, well anchored** - Professional Digital Publishing Platform

Anclora Press is a modern and comprehensive web application for creating, editing, and publishing digital books. Designed with cutting-edge technologies, it offers an intuitive experience for both beginner authors and publishing professionals.

## 🌟 Key Features

### 📝 Advanced Editor
- **Rich text editor** with Markdown and MDX support
- **Basic and advanced editor** for different user levels
- **Document import** in multiple formats (TXT, MD, PDF, DOCX, RTF, ODT, EPUB)
- Automatic conversion with Pandoc

### 📖 Content Management
- **Chapter organization** with drag and drop
- **Visual structure** of your book
- **Real-time collaborative editing**
- **Version tracking** of changes

### 🎨 Professional Design
- **Predefined template gallery**
- **Visual cover editor** with color and image customization
- **Back cover design** with reviews and author information
- **Turquoise color palette** - modern and professional visual brand
- **Dark and light mode** with maximum WCAG AA readability

### 👥 Collaboration
- **Real-time collaboration panel**
- **Comment system** for review
- **Document version tracking**
- **Permission management** (owner, editor, commenter)

### 🤖 AI Assistance
- **Style suggestions** to improve content
- **AI-powered cover generation**
- **Intelligent text rewriting**

### 📊 Preview and Export
- **Single and double page preview**
- **Dynamic zoom control**
- **Export in multiple formats**:
  - PDF (optimized for printing)
  - EPUB (standard for ebooks)
  - More formats coming soon

### 🌐 Multi-language Support
- **Full support for Spanish and English**
- Fully translated interface
- Dynamic language switching without reload

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.5** - React framework with App Router
- **TypeScript 5** - Static typing
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Accessible components (50+)
- **Framer Motion** - Fluid animations
- **React Hook Form + Zod** - Validated forms

### Backend & Data
- **Prisma ORM** - Database management
- **SQLite** - Lightweight database
- **Next.js API Routes** - Backend endpoints
- **TanStack Query v5** - Caching and synchronization
- **Axios** - HTTP client

### Editing & Documents
- **MDXEditor v3.39.1** - Rich editor
- **Pandoc** - Document conversion
- **React Markdown** - Markdown rendering
- **Sharp** - Image processing

### Integrations
- **Next Auth v4** - Authentication
- **Next Intl** - Internationalization
- **DND Kit** - Drag & Drop
- **Recharts** - Charts
- **Lucide React** - Icon library

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Pandoc installed on your system

## 🚀 Installation

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/usuario/anclora-press.git
cd anclora-press
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure environment variables
Create a \`.env.local\` file in the project root:
\`\`\`env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
\`\`\`

### 4. Initialize the database
\`\`\`bash
npm run db:push
\`\`\`

### 5. Start the development server
\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`

## 📱 Usage

### Main Workflow

1. **Content** - Write or import your content
2. **Chapters** - Organize your book into chapters
3. **Template** - Choose the visual design
4. **Cover** - Design your cover
5. **Back Cover** - Add information and reviews
6. **Preview** - Review your complete book
7. **Collaboration** - Work with other users
8. **AI** - Improve your content with assistance
9. **Export** - Publish in multiple formats

## 🔧 Available Commands

### Development
\`\`\`bash
npm run dev              # Start development server
npm run dev:clean       # Clean ports and start dev
npm run lint            # Run ESLint
\`\`\`

### Database
\`\`\`bash
npm run db:push         # Sync schema with database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:reset        # Reset database and re-seed
\`\`\`

### Production
\`\`\`bash
npm run build           # Build for production
npm start               # Start production server
\`\`\`

### Utilities
\`\`\`bash
npm run clean-ports     # Clean ports 3000 and 81
npm run promote         # Sync branches (dev → main)
\`\`\`

## 🎨 Design System

### Color Palette
- **Deep Blue**: #00253F
- **Dark Teal**: #005872
- **Vivid Turquoise**: #00B4A0
- **Mint**: #80ED99
- **Sand**: #D6BFA2

### Typography
- **Serif**: Libre Baskerville (headings)
- **Sans**: Inter (body)
- **Mono**: JetBrains Mono (code)

## 🌐 Internationalization

Anclora Press fully supports Spanish and English. The translation system is centralized in \`src/hooks/use-language.ts\`.

## 🔐 License

This project is under the MIT License. See [LICENSE.en.md](LICENSE.en.md).

## 👥 Contributing

Contributions are welcome. Please open a Pull Request.

## 📧 Contact

For questions or suggestions, please use the repository issues.

---

**Developed with ❤️ for authors and publishing professionals**
