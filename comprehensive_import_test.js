const fs = require('fs');
const path = require('path');

async function testImport(filePath, fileName) {
  try {
    const buffer = fs.readFileSync(filePath);
    const formData = new FormData();
    const blob = new Blob([buffer]);
    const file = new File([blob], fileName, { type: 'application/octet-stream' });
    formData.append('file', file);

    console.log(`\n📤 Importando: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);
    
    const response = await fetch('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log(`❌ Error: ${result.error}`);
      return false;
    }

    console.log(`✅ Importación exitosa`);
    console.log(`   - Tipo: ${result.metadata.type}`);
    console.log(`   - Palabras: ${result.metadata.wordCount || 'N/A'}`);
    console.log(`   - Páginas: ${result.metadata.pages || 'N/A'}`);
    console.log(`   - Converter: ${result.metadata.converter || 'N/A'}`);
    
    if (result.chapters && result.chapters.length > 0) {
      console.log(`   - Capítulos detectados: ${result.chapters.length}`);
      result.chapters.slice(0, 3).forEach((ch, i) => {
        console.log(`     ${i + 1}. ${ch.title} (Nivel ${ch.level})`);
      });
    } else {
      console.log(`   - Capítulos: No detectados`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== PRUEBAS INTEGRALES DE IMPORTACIÓN ===');
  
  const tests = [
    { path: '/home/ubuntu/upload/AnálisisdeFanfic_ThrillerPsicológicoyFantasía.docx', name: 'DOCX con capítulos' },
    { path: '/home/ubuntu/upload/Blog_GLM-4-6V.pdf', name: 'PDF escaneado' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    if (fs.existsSync(test.path)) {
      const result = await testImport(test.path, test.name);
      if (result) passed++;
      else failed++;
    } else {
      console.log(`\n⚠️  Archivo no encontrado: ${test.path}`);
      failed++;
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`✅ Pasadas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`Total: ${passed + failed}`);
}

runTests().catch(console.error);
