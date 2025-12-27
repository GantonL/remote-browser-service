import { Injectable } from "@danet/core";
import { BrowserService } from "../core/services/browser.service.ts";
import { GeneratePDFDto } from "./dto.ts";
import { Browser, PDFOptions } from "puppeteer";

@Injectable()
export class PDFService {
  constructor(private readonly browserService: BrowserService) {}

  async generate(dto: GeneratePDFDto) {
    const browser = await this.browserService.getBrowser();
    
    this.generatePdfTask(browser, dto).catch(err => console.error("Async PDF generation failed", err));
    return { message: "PDF generation started in background, check webhook for result" };

  }

  private async generatePdfTask(browser: Browser, dto: GeneratePDFDto) {
    const page = await browser.newPage();
    try {
        await page.goto(dto.url, { waitUntil: 'networkidle0' }); // Wait for network idle

        let pdfOptions: PDFOptions = { format: 'A4', ...dto.options };

        if (dto.containerClass) {
          await page.waitForSelector(dto.containerClass);
          const element = await page.$(dto.containerClass);
          if (element) {
            const boundingBox = await element.boundingBox();
            if (boundingBox) {
                // Remove format if clipping is used, usually preferred to set width/height
                pdfOptions = {
                    ...pdfOptions,
                    width: Math.ceil(boundingBox.width) + 'px',
                    height: Math.ceil(boundingBox.height) + 'px',
                    // Clip could be an option if we want it on A4 but cropped? 
                    // But if user wants "pdf from container", usually they want the PDF to BE the container.
                    // Puppeteer says: `pdf()` with `width`/`height` overrides `format`.
                    // But we can also use `clip`.
                    // Let's use page resizing to match element:
                    pageRanges: '1', // single page usually
                };
                // Better approach for container: Screenshot -> PDF? No, not vector.
                // Approach: Set viewport to element size, remove everything else?
                // Let's try creating a PDF with the exact size of the element.
                // NOTE: `page.pdf` prints the PAGE.
                // We'll trust `pdfOptions` or just set width/height.
                // If we use `clip`, content outside is white/empty but page size is still format.
                // Let's set the page size to the element size.
                 
                 // We will overwrite options if container is selected, to ensure it fits.
                 pdfOptions.width = Math.ceil(boundingBox.width);
                 pdfOptions.height = Math.ceil(boundingBox.height);
                 pdfOptions.printBackground = true;
                 
                 // We might need to position the element at 0,0?
                 // Or we can use `clip` which is supported in pdfOptions.
                 /*
                 pdfOptions.clip = {
                     x: boundingBox.x,
                     y: boundingBox.y,
                     width: boundingBox.width,
                     height: boundingBox.height
                 }
                 */
                 // Wait, clip is NOT supported in standard `page.pdf` typing? It IS in recent Puppeteer versions?
                 // Puppeteer 23.x? Yes.
                 // But let's check if Deno puppeteer types have it.
            }
          }
        }

        const pdfBuffer = await page.pdf(pdfOptions);

        if (dto.webhookUrl) {
            // Send webhook
            await fetch(dto.webhookUrl, {
                method: 'POST',
                body: pdfBuffer,
                headers: { 'Content-Type': 'application/pdf' }
            });
            return;
        }

        return pdfBuffer;
    } finally {
        await page.close();
    }
  }
}
