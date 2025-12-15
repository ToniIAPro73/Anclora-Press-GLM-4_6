import assert from "node:assert"
import { buildStructuredChapters } from "../src/lib/document-importer"
import { buildPreviewMarkdown } from "../src/components/preview-modal"

type TestCase = {
  name: string
  fn: () => void | Promise<void>
}

const tests: TestCase[] = []

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn })
}

function expect(condition: any, message: string) {
  assert.ok(condition, message)
}

test("extracts preface separately from chapter headings", () => {
  const markdown = `
Bienvenida al manuscrito

Incluye resumen breve antes de comenzar.

1. Capítulo Uno
Este es el primer capítulo.
`

  const chapters = buildStructuredChapters(undefined, markdown)
  expect(chapters.length >= 2, "Debe incluir prefacio y al menos un capítulo")
  expect(chapters[0].title.toLowerCase().includes("bienvenida"), "El prefacio conserva el título inicial")
  expect(chapters[1].title.includes("Capítulo Uno"), "El primer capítulo mantiene el encabezado original")
  expect(!chapters[0].markdown?.includes("Capítulo Uno"), "El prefacio no debe contener el contenido del capítulo")
})

test("numeric headings with leading spaces become chapters", () => {
  const markdown = `
Introductorio

   1. Capítulo Numerado
Contenido del capítulo.

      1.1 Subapartado
Texto adicional
`

  const chapters = buildStructuredChapters(undefined, markdown)
  expect(chapters.length >= 2, "Debe detectar capítulos con números aunque tengan espacios iniciales")
  expect(
    chapters[1].title === "Capítulo Numerado",
    "El encabezado numérico debe convertirse en capítulo"
  )
  expect(
    chapters[1].markdown?.includes("Subapartado"),
    "Los subapartados deben pertenecer al mismo capítulo agrupado"
  )
})

test("html heading hierarchy groups nested sections", () => {
  const html = `
<h1>Capítulo A</h1>
<p>Introducción</p>
<h2>Detalle</h2>
<p>Detalle contenido</p>
<h1>Capítulo B</h1>
<p>Otra sección</p>
`

  const chapters = buildStructuredChapters(html, undefined)
  expect(chapters.length === 2, "Debe contener los dos capítulos detectados")
  expect(
    chapters[0].title === "Capítulo A" && chapters[0].html.includes("<h2>Detalle</h2>"),
    "El capítulo debe conservar sus sub apartados"
  )
})

test("buildPreviewMarkdown incluye portada y capítulos ordenados", () => {
  const markdown = buildPreviewMarkdown({
    title: "Libro de prueba",
    subtitle: "Guía rápida",
    author: "Anclora",
    template: "modern",
    coverColor: "#123456",
    coverImage: "https://example.com/cover.png",
    genre: "fiction",
    content: "Contenido inicial del manuscrito.",
    chapters: [
      { title: "Capítulo Alfa", content: "Texto alfa", order: 2 },
      { title: "Prólogo", content: "Texto prólogo", order: 1 },
    ],
  })

  expect(markdown.includes("![Portada generada](https://example.com/cover.png)"), "La imagen de portada debe aparecer")
  const indexPrologo = markdown.indexOf("## Prólogo")
  const indexAlpha = markdown.indexOf("## Capítulo Alfa")
  expect(indexPrologo < indexAlpha, "Los capítulos deben respetar el orden definido")
})

test("buildPreviewMarkdown muestra mensaje cuando no hay contenido", () => {
  const markdown = buildPreviewMarkdown({
    title: "",
    subtitle: "",
    author: "",
    template: "modern",
    coverColor: "#000000",
    coverImage: null,
    genre: "fiction",
    content: "",
    chapters: [],
  })

  expect(markdown.includes("Todavía no hay contenido"), "Debe informar cuando no existe contenido para previsualizar")
})

async function run() {
  const results: { name: string; passed: boolean; error?: Error }[] = []

  for (const { name, fn } of tests) {
    try {
      await fn()
      results.push({ name, passed: true })
    } catch (error) {
      results.push({ name, passed: false, error: error as Error })
    }
  }

  const failed = results.filter((r) => !r.passed)

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}`)
    } else {
      console.error(`❌ ${result.name}`)
      console.error(result.error)
    }
  }

  if (failed.length) {
    console.error(`\n${failed.length} test(s) failed`)
    process.exit(1)
  }

  console.log(`\nAll ${results.length} tests passed`)
}

run()
