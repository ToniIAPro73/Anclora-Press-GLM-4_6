const fs = require('fs');

// Simular la función extractChaptersFromMarkdown
function extractChaptersFromMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headingRegex = /^(#{1,6})\s+(.*)$/;
  const chapters = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      if (current) {
        const markdownContent = current.lines.join("\n").trim();
        chapters.push({
          title: current.title,
          level: current.level,
          html: "",
          markdown: markdownContent,
          wordCount: markdownContent
            .replace(/^#+\s+/gm, "")
            .split(/\s+/)
            .filter((word) => word.length > 0).length,
        });
      }
      current = {
        title: match[2].trim(),
        level: match[1].length,
        lines: [line],
      };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    const markdownContent = current.lines.join("\n").trim();
    chapters.push({
      title: current.title,
      level: current.level,
      html: "",
      markdown: markdownContent,
      wordCount: markdownContent
        .replace(/^#+\s+/gm, "")
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    });
  }

  return chapters;
}

// Crear un ejemplo de Markdown con encabezados
const markdown = `# Título Principal

Este es el contenido del título principal.

## Sección 1

Contenido de la sección 1.

### Subsección 1.1

Contenido de la subsección 1.1.

## Sección 2

Contenido de la sección 2.
`;

console.log('=== PRUEBA DE EXTRACCIÓN DE CAPÍTULOS ===\n');
console.log('Markdown de entrada:');
console.log(markdown);
console.log('\n=== CAPÍTULOS DETECTADOS ===\n');

const chapters = extractChaptersFromMarkdown(markdown);
console.log(`Total de capítulos: ${chapters.length}\n`);

chapters.forEach((ch, i) => {
  console.log(`${i + 1}. ${ch.title} (Nivel ${ch.level}, ${ch.wordCount} palabras)`);
  console.log(`   Contenido: ${ch.markdown.substring(0, 100)}...`);
  console.log();
});
