// Simular la función buildStructuredChapters
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

function buildStructuredChapters(html, markdown) {
  if (!html && !markdown) {
    return [];
  }

  const htmlSections = html ? [] : [];
  const markdownSections = markdown ? extractChaptersFromMarkdown(markdown) : [];
  const count = Math.max(htmlSections.length, markdownSections.length);
  const chapters = [];

  for (let i = 0; i < count; i++) {
    const htmlSection = htmlSections[i];
    const markdownSection = markdownSections[i];
    const title =
      htmlSection?.title ||
      markdownSection?.title ||
      `Sección ${chapters.length + 1}`;
    const level = htmlSection?.level || markdownSection?.level || 1;
    const htmlContent =
      htmlSection?.html ||
      (markdownSection
        ? `<h${markdownSection.level}>${markdownSection.title}</h${markdownSection.level}>${markdownSection.markdown}`
        : "");
    const markdownContent =
      markdownSection?.markdown || (htmlSection ? "" : "");
    const wordCount =
      htmlSection?.wordCount || markdownSection?.wordCount || 0;

    chapters.push({
      title,
      level,
      html: htmlContent,
      markdown: markdownContent,
      wordCount,
    });
  }

  return chapters;
}

// Test
const markdown = `# Título Principal

Este es el contenido del título principal.

## Sección 1

Contenido de la sección 1.

### Subsección 1.1

Contenido de la subsección 1.1.

## Sección 2

Contenido de la sección 2.
`;

console.log('=== PRUEBA DE buildStructuredChapters ===\n');

const chapters = buildStructuredChapters(null, markdown);
console.log(`Total de capítulos: ${chapters.length}\n`);

chapters.forEach((ch, i) => {
  console.log(`${i + 1}. ${ch.title} (Nivel ${ch.level}, ${ch.wordCount} palabras)`);
});
