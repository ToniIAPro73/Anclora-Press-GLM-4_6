const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');

// Create a simple DOCX document
const doc = new Document({
  sections: [{
    properties: {
      title: 'Documento de Prueba AncloraPress',
      subject: 'Documento para probar conversión',
      creator: 'AncloraPress System',
      keywords: 'prueba, conversion, docx'
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'AncloraPress - Documento de Prueba',
            bold: true,
            size: 24
          }),
          new TextRun({
            text: '\n\nEste documento es para probar la funcionalidad de importación y conversión de archivos en AncloraPress.\n\n',
            size: 12
          })
        ]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'Capítulo 1: Introducción',
            bold: true,
            size: 18
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n',
            size: 11
          })
        ]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: 'Sección 1.1: Conceptos Fundamentales',
            bold: true,
            size: 16
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n',
            size: 11
          })
        ]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'Capítulo 2: Características y Beneficios',
            bold: true,
            size: 18
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.\n\n',
            size: 11
          })
        ]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: 'Tabla de Características',
            bold: true,
            size: 16
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '| Característica | Descripción | Estado |\n',
            bold: true
          }),
          new TextRun({
            text: '|------------|-------------|--------|\n',
            bold: true
          }),
          new TextRun({
            text: '| Editor básico | Interfaz simple e intuitiva | ✓ Implementado |\n',
            size: 11
          }),
          new TextRun({
            text: '| Editor avanzado | Herramientas profesionales | ✓ Implementado |\n',
            size: 11
          }),
          new TextRun({
            text: '| Importación | Múltiples formatos soportados | ✓ Implementado |\n',
            size: 11
          }),
          new TextRun({
            text: '| Exportación | PDF, EPUB, DOCX | ✓ Implementado |\n',
            size: 11
          })
        ]
      })
    ]
  }]
});

// Generate DOCX file
const packer = new Packer();
const buffer = packer.toBuffer(doc);

// Write to file
fs.writeFileSync('test-document.docx', buffer);

console.log('DOCX document created successfully: test-document.docx');