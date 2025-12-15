const fs = require('fs');
const mammoth = require('mammoth');
function normalizeMarkdownEscapes(markdown) {
  return markdown.replace(/\\([\\*_{}\[\]()#+\-.!<>~|])/g, '');
}
function extractPrefaceFromMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headingRegex = /^(#{1,6})\s+/;
  const numericHeadingRegex = /^\d+(?:\.\d+)*\.\s+/;
  const firstHeadingIndex = lines.findIndex((line) => headingRegex.test(line) || numericHeadingRegex.test(line));
  const prefaceLines = firstHeadingIndex === -1 ? lines : lines.slice(0, firstHeadingIndex);
  const content = prefaceLines.join('\n').trim();
  if (!content) return null;
  const titleLine = prefaceLines.find((line) => line.trim().length > 0)?.trim() || 'Introducción';
  return { content, title: titleLine };
}
(async () => {
  const buffer = fs.readFileSync('docs/Analisis_Critico_El_Pacto_de_Jade.docx');
  const md = normalizeMarkdownEscapes((await mammoth.convertToMarkdown({ buffer })).value);
  const preface = extractPrefaceFromMarkdown(md);
  console.log('preface length', preface?.content.length);
  console.log('title', preface?.title);
})();
