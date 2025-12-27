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
        await page.emulateMediaType('screen');
        await page.goto(dto.url, { waitUntil: 'networkidle2' });

        const pdfOptions: PDFOptions = { format: 'A4', ...dto.options, path: 'test.pdf' };

        if (dto.containerClass) {
          await page.waitForSelector(dto.containerClass);
          
          await page.evaluate((selector) => {
            // @ts-ignore: Accessing DOM elements in puppeteer context
            const element = document.querySelector(selector);
            if (element) {
                // @ts-ignore: Modifying body in puppeteer context
                document.body.innerHTML = '';
                // @ts-ignore: Appending element in puppeteer context
                document.body.appendChild(element);
            }
          }, dto.containerClass);
        }

        const pdfBuffer = await page.pdf(pdfOptions);

        if (dto.webhookUrl) {
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
