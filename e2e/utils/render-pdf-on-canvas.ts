import type { Page } from "@playwright/test";
import { INVOICE_PDF_FONTS } from "@/config";

const FONT_FACE_CSS = `
  @font-face {
    font-family: 'Open Sans';
    font-weight: 400;
    src: url('${INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_REGULAR}') format('truetype');
  }
  @font-face {
    font-family: 'Open Sans';
    font-weight: 700;
    src: url('${INVOICE_PDF_FONTS.DEFAULT_TEMPLATE.OPEN_SANS_700}') format('truetype');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 400;
    src: url('${INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_REGULAR}') format('truetype');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 500;
    src: url('${INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_MEDIUM}') format('truetype');
  }
  @font-face {
    font-family: 'Inter';
    font-weight: 600;
    src: url('${INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_SEMIBOLD}') format('truetype');
  }
`;

/**
 * The most **reliable** way (cross-browser and cross-platform) to screenshot a PDF is to use a canvas and render the PDF to it
 * https://github.com/karlhorky/playwright-tricks?tab=readme-ov-file#screenshot-comparison-tests-of-pdfs
 *
 * **Docs**: https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html
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
                ${FONT_FACE_CSS}
            </style>
        </head>
        <body>
            <canvas id="pdf"></canvas>

            <script type="module">
                import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.mjs'

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.mjs'

                pdfjsLib.GlobalWorkerOptions.fontExtraProperties = true

                await Promise.all([
                    document.fonts.load('400 16px "Open Sans"'),
                    document.fonts.load('700 16px "Open Sans"'),
                    document.fonts.load('400 16px "Inter"'),
                    document.fonts.load('500 16px "Inter"'),
                    document.fonts.load('600 16px "Inter"'),
                ]);
                await document.fonts.ready;

                const pdfData = new Uint8Array([${pdfBytes.join(",")}])

                const pdf = await pdfjsLib.getDocument({ data: pdfData, disableFontFace: false, useSystemFonts: false }).promise;

                const page = await pdf.getPage(1)

                const viewport = page.getViewport({ scale: 2 })

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

/**
 * Renders all pages of a multi-page PDF vertically stacked on a single canvas
 *
 * **Docs**: https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html
 */
export async function renderMultiPagePdfOnCanvas(
  page: Page,
  pdfBytes: Uint8Array,
) {
  await page.setContent(`
        <!doctype html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <style>
                body { margin: 0 }
                canvas { display: block }
                ${FONT_FACE_CSS}
            </style>
        </head>
        <body>
            <canvas id="pdf"></canvas>

            <script type="module">
                import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.mjs'

                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.mjs'

                pdfjsLib.GlobalWorkerOptions.fontExtraProperties = true

                await Promise.all([
                    document.fonts.load('400 16px "Open Sans"'),
                    document.fonts.load('700 16px "Open Sans"'),
                    document.fonts.load('400 16px "Inter"'),
                    document.fonts.load('500 16px "Inter"'),
                    document.fonts.load('600 16px "Inter"'),
                ]);
                await document.fonts.ready;

                const pdfData = new Uint8Array([${pdfBytes.join(",")}])

                const pdf = await pdfjsLib.getDocument({ data: pdfData, disableFontFace: false, useSystemFonts: false }).promise;

                const numPages = pdf.numPages
                const pageGap = 40 // Space between pages in pixels

                // Get all page viewports to calculate total width and height
                const viewports = []
                let totalWidth = 0
                let maxHeight = 0

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i)
                    const viewport = page.getViewport({ scale: 2 })
                    viewports.push({ page, viewport })
                    totalWidth += viewport.width
                    if (i < numPages) {
                        totalWidth += pageGap // Add gap between pages
                    }
                    maxHeight = Math.max(maxHeight, viewport.height)
                }

                // Create a single canvas to fit all pages horizontally
                const canvas = document.getElementById('pdf')
                canvas.width = totalWidth
                canvas.height = maxHeight

                const ctx = canvas.getContext('2d')
                ctx.imageSmoothingEnabled = false

                // Render all pages sequentially, placing them horizontally
                let currentX = 0
                for (const { page, viewport } of viewports) {
                    ctx.save()
                    ctx.translate(currentX, 0)
                    
                    await page.render({
                        canvasContext: ctx,
                        viewport
                    }).promise
                    
                    ctx.restore()
                    currentX += viewport.width + pageGap
                }

                window.__PDF_RENDERED__ = true
            </script>
        </body>
        </html>
        `);
}
