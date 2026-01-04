import type { Page } from "@playwright/test";

/**
 * The most **reliable** way (cross-browser and cross-platform) to screenshot a PDF is to use a canvas and render the PDF to it
 * https://github.com/karlhorky/playwright-tricks?tab=readme-ov-file#screenshot-comparison-tests-of-pdfs
 */
export async function renderPdfOnCanvas(page: Page, pdfBytes: Uint8Array) {
  await page.setContent(`
        <!doctype html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <style>
                body { margin: 0 }
                canvas { display: block }
            </style>
        </head>
        <body>
            <canvas id="pdf"></canvas>

            <script type="module">
                import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.mjs'

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.mjs'

                pdfjsLib.GlobalWorkerOptions.fontExtraProperties = true


                const pdfData = new Uint8Array([${pdfBytes.join(",")}])

                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
                const page = await pdf.getPage(1)

                const viewport = page.getViewport({ scale: 1.5 })

                const canvas = document.getElementById('pdf')
                const ctx = canvas.getContext('2d')
                
                ctx.imageSmoothingEnabled = false


                canvas.width = viewport.width
                canvas.height = viewport.height

                await page.render({ canvasContext: ctx, viewport }).promise

                window.__PDF_RENDERED__ = true
            </script>
        </body>
        </html>
        `);
}
