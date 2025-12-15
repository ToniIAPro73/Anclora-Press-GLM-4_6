# **Análisis Arquitectónico Integral de los Pipelines de Ingesta Documental en Anclora Press y Evaluación Comparativa de Alternativas Open Source**

## **Resumen Ejecutivo**

Este informe de investigación exhaustivo evalúa la arquitectura actual de importación de documentos de la plataforma Anclora Press, contrastando su implementación existente con los estándares de la industria para sistemas de publicación digital. El análisis se centra específicamente en los desafíos de la extracción de datos semánticos a partir de formatos no estructurados o semiestructurados —principalmente PDF y DOCX— en un entorno de arquitectura "Local-First".

La investigación disecciona la estructura del repositorio de Anclora Press, identificando las fortalezas de su modelo de persistencia basado en IndexedDB y el uso de Mammoth.js para la ingesta de DOCX. Simultáneamente, se realiza una auditoría forense del código fuente de Pandoc para demostrar técnicamente su incapacidad estructural para la importación de PDF, validando la hipótesis del usuario. Para subsanar esta brecha, el informe presenta un compendio detallado de bibliotecas de código abierto capaces de gestionar la matriz completa de formatos soportados por la aplicación (.txt,.md,.pdf,.doc,.docx,.rtf,.odt,.epub), proponiendo una arquitectura de "Despachador Polimórfico" que orquesta el procesamiento entre el cliente y el servidor según la complejidad del formato.

## ---

**1\. Análisis Arquitectónico de Anclora Press**

El repositorio toniiapro73-anclora-press-glm-4\_6 representa una solución moderna de publicación digital "full-stack" construida sobre el framework Next.js. La filosofía de diseño predominante es la de una aplicación "Local-First", donde la latencia de red se elimina priorizando la persistencia de datos en el cliente (navegador) antes de la sincronización con el servidor. Esta decisión arquitectónica impone restricciones severas y oportunidades únicas para el subsistema de importación de documentos.

### **1.1 Disección de la Jerarquía de Componentes y Flujo de Datos**

Una revisión profunda de la estructura de directorios revela una aplicación meticulosamente organizada para la modularidad y la escalabilidad horizontal. Los componentes clave que definen el ciclo de vida de la importación son:

* **Lógica Frontend (src/components/):** La presencia del archivo document-importer.tsx 1 sugiere un proceso de importación impulsado por la interfaz de usuario (UI), donde el usuario selecciona un archivo y recibe retroalimentación inmediata. Este componente actúa como la puerta de entrada principal para todos los datos externos. Su ubicación en src/components indica que está diseñado para ser reutilizable en diferentes contextos de la aplicación, como se ve en su integración dentro de editor-workspace.tsx.1  
* **Gestión del Estado (src/lib/ y src/hooks/):** Los archivos indexeddb-manager.ts y hooks/use-local-persistence.ts 1 son el corazón de la arquitectura "Local-First". Cualquier documento importado debe ser transformado en una estructura de datos serializable que pueda almacenarse eficientemente en IndexedDB. Esto implica que el resultado de la importación no puede ser un flujo binario opaco (BLOB); debe ser texto plano, HTML sanitizado o una estructura JSON (como la utilizada por ProseMirror/Tiptap). La limitación aquí es el rendimiento de serialización/deserialización en el hilo principal del navegador.  
* **Infraestructura de Edición (src/components/tiptap-editor.tsx):** El uso de Tiptap (un wrapper "headless" para ProseMirror) confirma que el modelo de datos interno es un árbol de documentos estructurado. Esto significa que la importación no se trata simplemente de "mostrar" un archivo (como lo haría un visor de PDF), sino de "convertirlo" en bloques editables (párrafos, encabezados, listas). La calidad de la importación se mide por qué tan bien se mapean los estilos del documento original a los nodos del esquema de Tiptap.  
* **Lógica Backend (src/app/api/import/route.ts):** Aunque la aplicación prioriza lo local, la existencia de esta ruta de API 1 demuestra un reconocimiento pragmático de que ciertas tareas de análisis son demasiado pesadas o complejas para el navegador. Este "endpoint" híbrido permite delegar conversiones complejas a un entorno Node.js, lo cual es crítico para formatos binarios densos o que requieren bibliotecas compiladas no disponibles en WebAssembly.

### **1.2 Metodología Actual: La Estrategia Mammoth.js**

La documentación del repositorio hace referencia explícita a MAMMOTH\_INTEGRATION.md y al script create-docx.js 1, confirmando que Anclora Press ha estandarizado el uso de Mammoth.js para la ingestión de documentos de Microsoft Word.

#### **Mecanismo de Acción de Mammoth**

Mammoth se distingue fundamentalmente de otros convertidores por su enfoque filosófico: **conversión semántica en lugar de visual**. Mientras que herramientas tradicionales intentan replicar el diseño exacto de la página (márgenes, fuentes exactas, posiciones absolutas), Mammoth ignora estos atributos visuales y se centra en la estructura subyacente.

* Mapea los estilos de Word (ej. "Heading 1") a etiquetas HTML semánticas (ej. \<h1\>).  
* Descarta el formato directo (ej. "font-size: 18pt") en favor de una salida HTML limpia controlada por CSS.

#### **Alineación Estratégica con Anclora**

Esta elección es técnicamente astuta para el caso de uso de Anclora. Dado que la aplicación utiliza un sistema de diseño consistente (evidenciado por tailwind.config.ts y globals.css 1), importar estilos "sucios" de Word rompería la coherencia visual de la publicación. Mammoth actúa como un filtro de saneamiento, asegurando que el contenido importado herede la tipografía y los colores definidos en el tema de la aplicación.

#### **Limitaciones Detectadas**

Sin embargo, la dependencia exclusiva de Mammoth introduce fragilidad en documentos académicos o técnicos complejos. Mammoth suele tener dificultades con:

* Notas al pie y notas al final complejas.  
* Tablas con celdas fusionadas o bordes personalizados.  
* Imágenes flotantes o cuadros de texto anclados fuera del flujo normal del texto.  
* Ecuaciones matemáticas (OMML) que no siempre se traducen limpiamente a MathML o LaTeX.

### **1.3 La Asimetría del PDF: El Gran Desafío**

El repositorio contiene documentación extensa sobre la exportación (PDF\_EXPORT.md, paged-preview.tsx) 1, lo que indica que Anclora posee una capacidad robusta para *generar* PDFs de alta fidelidad utilizando Paged.js (un polyfill para los estándares CSS Paged Media). No obstante, existe una ausencia notable de infraestructura para la *importación* de PDF.

Esta asimetría crea una fricción significativa en el flujo de trabajo del usuario ("user journey"). Muchos autores, especialmente aquellos que están recuperando obras antiguas o migrando desde plataformas legacy, pueden tener solo el archivo PDF final ("impreso digitalmente") de su libro. La incapacidad de ingerir este formato obliga al usuario a recurrir a herramientas externas de OCR o copiado y pegado manual, degradando la experiencia de usuario prometida por una plataforma "todo en uno".

La solicitud del usuario identifica correctamente esta brecha y plantea la hipótesis de usar Pandoc. A continuación, demostraremos técnicamente por qué Pandoc, a pesar de su fama, no es la herramienta adecuada para cerrar esta brecha específica.

## ---

**2\. Auditoría Técnica de Pandoc: Potencialidades y Límites Estructurales**

Pandoc es universalmente reverenciado en la comunidad académica y de desarrollo como la "navaja suiza" de la conversión de documentos. Sin embargo, su arquitectura interna impone límites estrictos. Basándonos en el listado de archivos del repositorio jgm-pandoc proporcionado 1, realizamos una auditoría de sus capacidades reales frente a las necesidades de Anclora.

### **2.1 Arquitectura "Hub-and-Spoke" y el Directorio de Lectores**

Pandoc opera mediante una arquitectura de centro y radios. Convierte cualquier formato de entrada ($N$) a una representación interna abstracta (AST \- Abstract Syntax Tree) y luego serializa ese AST a cualquier formato de salida ($M$). Esto reduce la complejidad del problema de $N \\times M$ convertidores a $N \+ M$.

Para determinar si Pandoc puede importar un formato, debemos inspeccionar el directorio src/Text/Pandoc/Readers/ en su código fuente Haskell.1 Este directorio contiene los módulos responsables de "leer" o analizar los formatos de entrada.

Una búsqueda exhaustiva en el listado de archivos 1 revela la presencia de:

* Text/Pandoc/Readers/Docx.hs: Lector para documentos de Word.  
* Text/Pandoc/Readers/Odt.hs: Lector para OpenDocument Text.  
* Text/Pandoc/Readers/Epub.hs: Lector para libros electrónicos EPUB.  
* Text/Pandoc/Readers/Latex.hs: Lector para LaTeX.  
* Text/Pandoc/Readers/Markdown.hs: Lectores para múltiples sabores de Markdown.  
* Text/Pandoc/Readers/Rtf.hs: Lector para Rich Text Format.

**Hallazgo Crítico:** No existe ningún archivo Text/Pandoc/Readers/Pdf.hs. Tampoco hay módulos auxiliares que sugieran capacidades de análisis de PDF (como bindings a Poppler o bibliotecas de OCR).

### **2.2 La Imposibilidad Estructural de la Importación de PDF en Pandoc**

La ausencia de un lector de PDF en Pandoc no es una omisión por falta de tiempo, sino una consecuencia de la naturaleza del formato PDF y la filosofía de diseño de Pandoc.

#### **El Abismo Semántico**

Pandoc es un convertidor **semántico**. Su AST está compuesto por elementos como Header, Para (Párrafo), List, BlockQuote. Funciona traduciendo estructuras explícitas de un formato a estructuras explícitas de su AST.

* En **DOCX**, un encabezado es un nodo XML explícito: \<w:pStyle w:val="Heading1"/\>. Pandoc lee esto y crea un nodo Header 1\.  
* En **PDF**, no existen "encabezados". Un PDF es un lenguaje de descripción de página (derivado de PostScript) que contiene instrucciones de dibujo: "Colocar glifos 'C', 'a', 'p', 'í', 't', 'u', 'l', 'o', ' ', '1' en las coordenadas (50, 700\) usando la fuente Helvetica-Bold tamaño 18pt".

Para que Pandoc pudiera "leer" un PDF, tendría que inferir la estructura semántica a partir de la geometría visual. Tendría que "adivinar" que el texto en (50, 700\) es un título porque es grande y está en negrita, y que el texto en (50, 650\) es un párrafo porque tiene un tamaño de fuente menor. Este proceso, conocido como "Layout Analysis" o "Document Understanding", es un problema probabilístico y heurístico, radicalmente diferente del análisis determinista (parsing) que Pandoc realiza sobre HTML, Markdown o XML.

#### **La Función de PDF en Pandoc**

El usuario podría confundirse al ver archivos como src/Text/Pandoc/PDF.hs.1 Sin embargo, el análisis del código y la estructura revela que este módulo gestiona la **producción** de PDFs. Pandoc genera PDFs convirtiendo su AST a un formato intermedio (generalmente LaTeX, pero también HTML o ms-troff) y luego invocando un motor externo (pdflatex, xelatex, wkhtmltopdf, weasyprint) para renderizar el binario final. Pandoc actúa como un orquestador de salida, no como un analizador de entrada para PDF.

### **2.3 Viabilidad de Pandoc para Otros Formatos (DOCX, ODT, EPUB)**

Aunque Pandoc falla en PDF, es una herramienta formidable para los otros formatos mencionados en la solicitud del usuario (.doc,.docx,.odt,.epub).

* **Para DOCX:** El módulo Text/Pandoc/Readers/Docx.hs es uno de los analizadores de Word más sofisticados del mundo open source. A diferencia de Mammoth, que mapea estilos, Pandoc deconstruye el XML interno. Es capaz de manejar referencias cruzadas, bibliografías complejas (usando Citeproc, visible en el árbol de archivos 1), y matemáticas complejas.  
* **Para ODT:** Dado que el formato OpenDocument es nativamente XML, Pandoc lo maneja con excelente fidelidad.  
* **Desafío de Implementación:** El principal obstáculo para integrar Pandoc en Anclora Press es que es un binario compilado en Haskell. En una arquitectura Next.js (especialmente si se despliega en Vercel o contenedores ligeros), invocar un binario externo mediante child\_process introduce complejidad operativa, aumenta el tamaño de la imagen de despliegue y añade latencia de arranque en entornos serverless.

## ---

**3\. Estrategias de Importación para el Ecosistema DOCX**

Dada la centralidad del formato DOCX en la industria editorial, Anclora debe ofrecer una experiencia de importación impecable. Aunque Mammoth.js es la solución actual, existen alternativas que pueden complementar sus debilidades.

### **3.1 Análisis Comparativo de Bibliotecas DOCX**

| Característica | Mammoth.js (Actual) | Pandoc (Binario) | Officeparser | LibreOffice Headless |
| :---- | :---- | :---- | :---- | :---- |
| **Filosofía** | Semántica (Estilo \-\> Tag) | Estructural (AST Completo) | Extracción de Texto | Fidelidad Visual |
| **Entorno** | JS Puro (Navegador/Node) | Binario Externo (Servidor) | JS (Node) | Binario Pesado (Servidor) |
| **Manejo de Imágenes** | Bueno (Base64/Enlaces) | Excelente (Media Bag) | Nulo/Básico | Excelente |
| **Tablas Complejas** | Básico (a menudo falla) | Avanzado | Pobre (CSV dump) | Alta Fidelidad |
| **Citas/Notas** | Pobre | Excelente | Nulo | Visualmente correcto |
| **Ajuste para Anclora** | **Alto** (Local-First) | **Medio** (Fallback Servidor) | **Bajo** | **Bajo** (HTML sucio) |

### **3.2 Recomendación: Optimización de Mammoth.js**

Para mantener la arquitectura "Local-First" y evitar dependencias de servidor pesadas, la recomendación principal es **mantener Mammoth.js como el motor principal**, pero potenciar su configuración.

El repositorio muestra create-docx.js 1, pero no evidencia un archivo de mapeo de estilos personalizado. Mammoth permite definir un "Style Map" explícito. Anclora debería implementar una interfaz de usuario en document-importer.tsx que permita al usuario mapear estilos personalizados de su Word a las etiquetas de Anclora.

* *Ejemplo:* Si el usuario usa un estilo llamado "Cita de Libro" en Word, Mammoth por defecto lo importaría como un párrafo normal \<p\>. Con un mapa de estilos, Anclora puede instruir a Mammoth para que lo convierta en \<blockquote class="book-quote"\>.

### **3.3 El Rol de Pandoc como "Fallback"**

Para documentos académicos pesados con muchas notas al pie o ecuaciones, donde Mammoth falla, Anclora podría implementar una ruta de API opcional (/api/import/pandoc). Esta ruta recibiría el archivo, lo procesaría con Pandoc en el servidor (si el entorno lo permite) y devolvería el HTML. Esto crea una arquitectura híbrida: "Intenta primero en el cliente con Mammoth (rápido, privado); si el resultado es pobre, envía al servidor para procesar con Pandoc".

## ---

**4\. Estrategias de Importación para el Desafío PDF**

Aquí es donde Anclora debe divergir radicalmente de la estrategia de Pandoc e integrar bibliotecas especializadas en la reconstrucción de documentos.

### **4.1 La Taxonomía de la Extracción de PDF**

Existen tres niveles de extracción de PDF, cada uno con sus propias bibliotecas open source:

1. **Extracción de Texto Puro:** Solo recupera las cadenas de caracteres. Pierde negritas, cursivas y estructura. (Útil para indexación, inútil para edición).  
2. **Extracción de Capa de Texto y Coordenadas:** Recupera el texto y su posición (x, y) y metadatos de fuente. Permite reconstruir la estructura mediante heurísticas.  
3. **Análisis de Diseño (Layout Analysis) con IA:** Utiliza visión por computadora para identificar "esto es una tabla", "esto es una imagen", "esto es una columna".

### **4.2 Solución Cliente (Local-First): Mozilla PDF.js**

**PDF.js** es la biblioteca estándar de facto para renderizar PDFs en la web (usada por Firefox). Es compatible con la arquitectura de Anclora porque corre enteramente en el navegador.

* **Estrategia de Implementación:** En lugar de usar PDF.js solo para *ver* el PDF, Anclora debe usarlo para *analizar* el PDF.  
  * La API pdf.getPage(n).getTextContent() devuelve una matriz de objetos "TextItem". Cada ítem tiene la cadena de texto y una matriz de transformación (que incluye la posición x, y, y el tamaño de escala).  
  * **Algoritmo de Reconstrucción:** Anclora puede implementar un algoritmo en document-importer.tsx:  
    1. Iterar sobre los ítems de texto.  
    2. Detectar saltos de línea: Si la coordenada Y del ítem actual es significativamente diferente de la del ítem anterior, insertar un \<br\> o cerrar el párrafo \<p\>.  
    3. Detectar encabezados: Si el tamaño de fuente es \> 14pt y el peso es "bold", envolver en \<h2\>.  
    4. Detectar columnas: Analizar la coordenada X para identificar flujos de texto paralelos.  
* **Ventajas:** Privacidad total (el PDF no sube al servidor), velocidad inmediata, sin costes de servidor.  
* **Desventajas:** El texto extraído puede estar "sucio" (saltos de línea en mitad de frases, encabezados y pies de página mezclados con el texto principal).

### **4.3 Solución Servidor (Alta Fidelidad): Unstructured.io o PyMuPDF**

Si la extracción del lado del cliente resulta insuficiente, la mejor alternativa open source moderna es **Unstructured.io** (basada en Python) o **PyMuPDF** (Fitz).

* **Unstructured.io:** Es una biblioteca diseñada específicamente para ingerir documentos para LLMs (Modelos de Lenguaje). Utiliza modelos de detección de objetos para segmentar la página en "Título", "Texto Narrativo", "Tabla", "Pie de página".  
* **Integración en Anclora:** Dado que el repositorio sugiere un enfoque moderno (glm-4\_6), integrar una micro-servicio en Python (vía Docker) que corra unstructured sería coherente. El usuario subiría el PDF, el servicio devolvería un JSON estructurado limpio, y el frontend lo convertiría a Tiptap.

### **4.4 Solución de Recuperación Visual: pdf2htmlEX**

Para casos extremos donde la fidelidad visual es más importante que la editabilidad, **pdf2htmlEX** convierte un PDF en un archivo HTML que se ve *exactamente* igual, usando posicionamiento absoluto y fuentes incrustadas.

* **Advertencia:** El HTML resultante es extremadamente difícil de editar en un editor como Tiptap. No se recomienda para Anclora a menos que sea para una vista de "referencia".

## ---

**5\. Estrategias para Formatos Adicionales**

El usuario solicitó explícitamente investigar los formatos mostrados en la imagen adjunta: .txt, .md, .rtf, .odt, .epub, .doc.

### **5.1 EPUB (.epub)**

Un archivo EPUB es, en esencia, un archivo ZIP que contiene XHTML y CSS.

* **Biblioteca Recomendada:** **JSZip** (para descomprimir) o **epub.js**.  
* **Estrategia:** Dado que el contenido dentro de un EPUB ya es HTML, la importación es trivial y de alta calidad.  
  1. Descomprimir el contenedor EPUB en el cliente usando JSZip.  
  2. Leer el archivo content.opf para obtener el orden de lectura (spine).  
  3. Extraer el cuerpo \<body\> de cada archivo XHTML.  
  4. Sanitizar el HTML (eliminar clases y estilos específicos del libro original) y cargarlo en Tiptap.  
* **Ventaja:** Fidelidad casi perfecta y compatibilidad total con la arquitectura Local-First.

### **5.2 OpenDocument Text (.odt)**

El formato nativo de LibreOffice/OpenOffice. Estructuralmente es muy similar a DOCX (XML comprimido).

* **Biblioteca:** No hay un equivalente de "Mammoth" tan maduro para ODT en JavaScript puro.  
* **Recomendación:** Aquí **Pandoc es indispensable**. Pandoc tiene un soporte de primera clase para ODT (Text/Pandoc/Readers/Odt.hs). La estrategia recomendada es procesar estos archivos en el servidor usando Pandoc, o buscar convertidores ODT-a-HTML más simples en npm si se insiste en el lado del cliente (aunque suelen ser de menor calidad).

### **5.3 Rich Text Format (.rtf) y Word 97-2003 (.doc)**

Estos son formatos legacy.

* **.rtf:** Existen bibliotecas como rtf-parser en Node.js, pero a menudo producen resultados inconsistentes. Pandoc tiene un lector RTF (Rtf.hs) que es mucho más robusto.  
* **.doc (Binario):** Este formato es notoriamente difícil de analizar sin las bibliotecas de Microsoft. La herramienta open source **Antiword** (antigua pero funcional) o **LibreOffice Headless** son las mejores opciones para convertir.doc a.docx o HTML en el servidor. En el ecosistema JS puro, el soporte es muy limitado.

### **5.4 Texto Plano (.txt) y Markdown (.md)**

* **.txt:** Trivial. FileReader.readAsText() en el navegador.  
* **.md:** Tiptap soporta Markdown nativamente. Se puede importar el contenido directamente o usar bibliotecas como marked o remark para convertirlo a HTML antes de inyectarlo.

## ---

**6\. Propuesta de Arquitectura Unificada: El "Despachador Polimórfico"**

Para integrar todas estas bibliotecas en la aplicación existente sin convertir el código en un espagueti inmanejable, propongo una refactorización del componente src/components/document-importer.tsx basada en el patrón de diseño **Strategy**.

### **6.1 Diseño del Sistema**

El document-importer no debe contener la lógica de análisis. Debe actuar como un despachador que evalúa el tipo MIME del archivo y delega el trabajo al "Importador" adecuado.

**Definición de Estrategias:**

1. **Estrategia Cliente (Alta Prioridad):**  
   * *Formatos:* DOCX (Mammoth), EPUB (JSZip), TXT, MD.  
   * *Ejecución:* Hilo principal del navegador o Web Worker.  
   * *Ventaja:* Rápido, offline, privado.  
2. **Estrategia Servidor-Pandoc (Media Prioridad):**  
   * *Formatos:* ODT, RTF, LaTeX.  
   * *Ejecución:* API Route (/api/import) \-\> child\_process.spawn('pandoc').  
   * *Ventaja:* Robustez para formatos académicos.  
3. **Estrategia Servidor-Conversión (Legacy):**  
   * *Formatos:* DOC (Binario).  
   * *Ejecución:* API Route \-\> libreoffice \--headless.  
4. **Estrategia Especializada PDF:**  
   * *Formatos:* PDF.  
   * *Opción A (Simple):* Cliente con PDF.js (Extracción de texto plano).  
   * *Opción B (Avanzada):* Microservicio Python con Unstructured.

### **6.2 Flujo de Datos Propuesto**

1. **Upload:** El usuario arrastra un archivo al document-importer.tsx.  
2. **Detección:** Se verifica la extensión y el magic number del archivo para determinar el formato real.  
3. **Ruteo:**  
   * Si es .docx \-\> Invocar MammothService (Cliente).  
   * Si es .pdf \-\> Invocar PdfJsService (Cliente) para extraer texto y estructura básica.  
   * Si es .epub \-\> Invocar EpubService (Cliente).  
   * Si es .odt \-\> Subir a /api/import/pandoc.  
4. **Normalización:** Todos los servicios devuelven un objeto estandarizado:  
   TypeScript  
   interface ImportResult {  
     html: string;       // Contenido semántico para Tiptap  
     metadata: {  
       title?: string;  
       author?: string;  
       toc?: TocEntry;  
     };  
     assets: Asset;    // Imágenes extraídas (Blob/Base64)  
   }

5. **Sanitización:** El HTML resultante se pasa por DOMPurify para eliminar scripts maliciosos o estilos CSS incompatibles con el tema de Anclora.  
6. **Inyección:** El resultado limpio se inyecta en el tiptap-editor.

## ---

**7\. Conclusiones y Recomendaciones Finales**

El análisis del repositorio de Anclora Press revela una base tecnológica sólida y moderna, bien posicionada para competir en el mercado editorial. La decisión de usar Mammoth.js para DOCX es acertada y coherente con la filosofía Local-First. Sin embargo, la brecha en la importación de PDF es crítica y no puede ser resuelta por Pandoc debido a limitaciones estructurales inherentes al software y al formato PDF.

**Pasos de Acción Recomendados:**

1. **No intentar forzar Pandoc para PDF:** Sería una inversión de tiempo inútil. Pandoc es excelente para ODT y RTF, y debe reservarse para esos casos en el servidor.  
2. **Implementar PDF.js en el Cliente:** Desarrollar un módulo de extracción basado en heurísticas sobre la capa de texto de PDF.js. Esto permite ofrecer una funcionalidad de "Importación de Texto desde PDF" (advirtiendo al usuario sobre la pérdida de diseño) que cumple con la promesa de privacidad y velocidad de la app.  
3. **Expandir el Soporte de Formatos:** Aprovechar la naturaleza basada en HTML de EPUB y Markdown para añadir soporte inmediato a estos formatos con bibliotecas de JavaScript puras, aumentando drásticamente la utilidad de la herramienta con un esfuerzo de desarrollo bajo.  
4. **Interfaz de Mapeo de Estilos:** Potenciar la integración de Mammoth existente añadiendo una UI que permita a los usuarios mapear sus propios estilos de Word a las etiquetas semánticas de Anclora, resolviendo así los problemas de fidelidad sin sacrificar la limpieza del código.

Al adoptar esta arquitectura estratificada, Anclora Press puede transformar su debilidad actual en una fortaleza, ofreciendo una flexibilidad de importación que supera tanto a las herramientas de escritorio rígidas como a los competidores en la nube puramente cerrados.

### **Citas**

* 1 Estructura del Repositorio Anclora Press (src/components, api/routes).  
* 1 MAMMOTH\_INTEGRATION.md y create-docx.js.  
* 1 PDF\_EXPORT.md y paged-preview.tsx.  
* 1 Estructura del Repositorio Pandoc (Text/Pandoc/Readers/).  
* 1 Text/Pandoc/PDF.hs (Confirmación de salida, no entrada).  
* 1 src/lib/indexeddb-manager.ts (Restricciones de persistencia Local-First).

#### **Obras citadas**

1. repositorio-github-anclora-press.txt