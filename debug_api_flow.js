const fs = require('fs');
const mammoth = require('mammoth');

// Simular las funciones de la API
function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
    '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&mdash;': '—', '&ndash;': '–',
    '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'",
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  return decoded;
}

function htmlToMarkdown(html) {
  let markdown = html;
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.split(/\n/).map((line) => '> ' + line.trim()).join('\n');
    return lines + '\n\n';
  });
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '');
    return '```\n' + cleanContent + '\n```\n\n';
  });
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '# ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '## ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '#### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '##### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (match, content) => {
    const text = stripHtmlTags(content);
    return '###### ' + text.trim() + '\n\n';
  });
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((item) => {
      const text = stripHtmlTags(item).trim();
      return '- ' + text;
    }).join('\n') + '\n\n';
  });
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((item, index) => {
      const text = stripHtmlTags(item).trim();
      return (index + 1) + '. ' + text;
    }).join('\n') + '\n\n';
  });
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__');
  markdown = markdown.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
    const text = stripHtmlTags(content).trim();
    return text ? text + '\n\n' : '';
  });
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<[^>]+>/g, '');
  markdown = decodeHtmlEntities(markdown);
  markdown = markdown.replace(/\n\n+/g, '\n\n');
  markdown = markdown.trim();
  return markdown;
}

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
  console.log(`\n[buildStructuredChapters] Entrada:`);
  console.log(`  - html: ${html ? 'presente (' + html.length + ' chars)' : 'null'}`);
  console.log(`  - markdown: ${markdown ? 'presente (' + markdown.length + ' chars)' : 'null'}`);

  if (!html && !markdown) {
    console.log(`  ⚠️  Ambos parámetros son null/undefined`);
    return [];
  }

  const htmlSections = html ? [] : [];
  const markdownSections = markdown ? extractChaptersFromMarkdown(markdown) : [];
  
  console.log(`  - htmlSections: ${htmlSections.length}`);
  console.log(`  - markdownSections: ${markdownSections.length}`);

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

  console.log(`  ✓ Capítulos construidos: ${chapters.length}`);
  return chapters;
}

async function debugApiFlow() {
  const docxPath = '/home/ubuntu/upload/AnálisisdeFanfic_ThrillerPsicológicoyFantasía.docx';
  const buffer = fs.readFileSync(docxPath);

  console.log('=== DEBUG: FLUJO COMPLETO DE LA API ===\n');

  // Simular parseDOCXEnhanced
  console.log('STEP 1: Llamar a parseDOCXEnhanced (Mammoth.js)');
  const result = await mammoth.convertToHtml({ buffer });
  const htmlVersion = result.value;
  const extractedText = htmlToMarkdown(htmlVersion);

  console.log(`  ✓ HTML generado: ${htmlVersion.length} chars`);
  console.log(`  ✓ Markdown generado: ${extractedText.length} chars`);

  // Simular buildStructuredChapters
  console.log('\nSTEP 2: Llamar a buildStructuredChapters');
  const structuredChapters = buildStructuredChapters(htmlVersion, extractedText);

  console.log('\nSTEP 3: Resultado final');
  console.log(`  - structuredChapters: ${structuredChapters ? structuredChapters.length : 'undefined'}`);
  
  if (structuredChapters && structuredChapters.length > 0) {
    console.log(`  ✓ Primeros 3 capítulos:`);
    structuredChapters.slice(0, 3).forEach((ch, i) => {
      console.log(`    ${i + 1}. ${ch.title} (Nivel ${ch.level})`);
    });
  }

  // Simular la respuesta JSON
  console.log('\nSTEP 4: Respuesta JSON simulada');
  const jsonResponse = {
    success: true,
    content: extractedText.substring(0, 500),
    contentHtml: htmlVersion.substring(0, 500),
    contentFormat: "markdown+html",
    chapters: structuredChapters,
    metadata: {
      type: "docx",
      wordCount: extractedText.split(/\s+/).length,
      pages: 20,
      converter: "Mammoth.js (Enhanced Semantic)",
    },
  };

  console.log(`  - chapters en JSON: ${jsonResponse.chapters ? jsonResponse.chapters.length : 'undefined'}`);
  console.log(`  - JSON.stringify(chapters): ${JSON.stringify(jsonResponse.chapters).substring(0, 200)}...`);
}

debugApiFlow().catch(console.error);
