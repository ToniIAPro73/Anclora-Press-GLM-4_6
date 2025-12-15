const fs = require('fs');
const mammoth = require('mammoth');
const path = require('path');

// Simular la función htmlToMarkdown
function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&mdash;': '—',
    '&ndash;': '–',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

function htmlToMarkdown(html) {
  let markdown = html;

  // STEP 1: Process complex nested structures FIRST
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.split(/\n/).map((line) => '> ' + line.trim()).join('\n');
    return lines + '\n\n';
  });

  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '');
    return '```\n' + cleanContent + '\n```\n\n';
  });

  // STEP 2: Convert heading tags (MUST be before paragraph conversion)
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

  // STEP 3: Handle lists
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

  // STEP 4: Convert inline formatting
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__');
  markdown = markdown.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');

  // STEP 5: Convert paragraph tags
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
    const text = stripHtmlTags(content).trim();
    return text ? text + '\n\n' : '';
  });

  // STEP 6: Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // STEP 7: Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // STEP 8: Decode HTML entities
  markdown = decodeHtmlEntities(markdown);

  // STEP 9: Clean up whitespace
  markdown = markdown.replace(/\n\n+/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

async function debugDocxConversion() {
  const docxPath = '/home/ubuntu/upload/AnálisisdeFanfic_ThrillerPsicológicoyFantasía.docx';
  const buffer = fs.readFileSync(docxPath);

  console.log('=== DEBUG: CONVERSIÓN DOCX A MARKDOWN ===\n');

  // Step 1: Convert with Mammoth
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  console.log('STEP 1: HTML generado por Mammoth.js');
  console.log(`Tamaño: ${html.length} caracteres`);
  console.log(`Primeros 1000 caracteres:\n${html.substring(0, 1000)}\n`);

  // Count headings in HTML
  const h1Count = (html.match(/<h1/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  console.log(`Encabezados HTML: h1=${h1Count}, h2=${h2Count}, h3=${h3Count}\n`);

  // Step 2: Convert HTML to Markdown
  const markdown = htmlToMarkdown(html);

  console.log('STEP 2: Markdown generado por htmlToMarkdown()');
  console.log(`Tamaño: ${markdown.length} caracteres`);
  console.log(`Primeros 1000 caracteres:\n${markdown.substring(0, 1000)}\n`);

  // Count headings in Markdown
  const mdH1Count = (markdown.match(/^# /gm) || []).length;
  const mdH2Count = (markdown.match(/^## /gm) || []).length;
  const mdH3Count = (markdown.match(/^### /gm) || []).length;
  console.log(`Encabezados Markdown: h1=${mdH1Count}, h2=${mdH2Count}, h3=${mdH3Count}\n`);

  // Step 3: Extract chapters
  function extractChaptersFromMarkdown(md) {
    const lines = md.split(/\r?\n/);
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

  const chapters = extractChaptersFromMarkdown(markdown);

  console.log('STEP 3: Capítulos extraídos');
  console.log(`Total: ${chapters.length}\n`);
  chapters.slice(0, 5).forEach((ch, i) => {
    console.log(`${i + 1}. ${ch.title} (Nivel ${ch.level}, ${ch.wordCount} palabras)`);
  });

  // Save the markdown to a file for inspection
  fs.writeFileSync('/tmp/debug_markdown.md', markdown);
  console.log('\n✓ Markdown guardado en: /tmp/debug_markdown.md');
}

debugDocxConversion().catch(console.error);
