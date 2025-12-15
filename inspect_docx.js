const fs = require('fs');
const mammoth = require('mammoth');
const path = require('path');

async function inspectDOCX() {
  const docxPath = '/home/ubuntu/upload/AnálisisdeFanfic_ThrillerPsicológicoyFantasía.docx';
  const buffer = fs.readFileSync(docxPath);

  // Convertir sin styleMap para ver qué genera Mammoth por defecto
  const result = await mammoth.convertToHtml({ buffer });
  
  console.log('=== ANÁLISIS DE HTML GENERADO POR MAMMOTH ===\n');
  console.log('Primeros 2000 caracteres del HTML:\n');
  console.log(result.value.substring(0, 2000));
  
  console.log('\n\n=== BÚSQUEDA DE ENCABEZADOS ===\n');
  const h1Count = (result.value.match(/<h1/gi) || []).length;
  const h2Count = (result.value.match(/<h2/gi) || []).length;
  const h3Count = (result.value.match(/<h3/gi) || []).length;
  const pCount = (result.value.match(/<p/gi) || []).length;
  const strongCount = (result.value.match(/<strong/gi) || []).length;
  
  console.log(`h1: ${h1Count}`);
  console.log(`h2: ${h2Count}`);
  console.log(`h3: ${h3Count}`);
  console.log(`p: ${pCount}`);
  console.log(`strong: ${strongCount}`);
  
  // Buscar patrones de párrafos con estilos
  const styleMatches = result.value.match(/<p[^>]*style="[^"]*"[^>]*>/gi) || [];
  console.log(`\nPárrafos con estilos inline: ${styleMatches.length}`);
  if (styleMatches.length > 0) {
    console.log('Ejemplos:');
    styleMatches.slice(0, 3).forEach(match => console.log(`  ${match}`));
  }
  
  // Buscar párrafos con clases
  const classMatches = result.value.match(/<p[^>]*class="[^"]*"[^>]*>/gi) || [];
  console.log(`\nPárrafos con clases: ${classMatches.length}`);
  if (classMatches.length > 0) {
    console.log('Ejemplos:');
    classMatches.slice(0, 3).forEach(match => console.log(`  ${match}`));
  }
  
  // Mostrar primeros párrafos
  console.log('\n=== PRIMEROS 5 PÁRRAFOS ===\n');
  const pMatches = result.value.match(/<p[^>]*>([^<]*)<\/p>/gi) || [];
  pMatches.slice(0, 5).forEach((p, i) => {
    const text = p.replace(/<[^>]+>/g, '').substring(0, 100);
    console.log(`${i + 1}. ${p.substring(0, 150)}...`);
  });
}

inspectDOCX().catch(console.error);
