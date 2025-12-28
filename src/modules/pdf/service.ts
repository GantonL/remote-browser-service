import { Injectable } from "@danet/core";
import { BrowserService } from "../core/services/browser.service.ts";
import { GeneratePDFDto } from "./dto.ts";
import { Browser, Page, PDFOptions } from "puppeteer";

@Injectable()
export class PDFService {
  constructor(private readonly browserService: BrowserService) {}

  async generate(dto: GeneratePDFDto) {
    const browser = await this.browserService.getBrowser();

    this.generatePdfTask(browser, dto).catch((err) =>
      console.error("Async PDF generation failed", err),
    );
    return {
      message: "PDF generation started in background, check webhook for result",
    };
  }

  private async generatePdfTask(browser: Browser, dto: GeneratePDFDto) {
    const page = await browser.newPage();
    try {
      await page.emulateMediaType("print");
      await page.goto(dto.url, { waitUntil: "networkidle2" });

      const pdfOptions: PDFOptions = {
        ...dto.options,
        format: dto.options?.format ?? "A4",
        margin: dto.options?.margin ?? {
          top: "5mm",
          bottom: "5mm",
          left: "5mm",
          right: "5mm",
        },
        path: "test.pdf",
      };

      if (dto.containerClass) {
        await this.hideEverythingBesidesContainer(page, dto.containerClass);
      }

      const pdfBuffer = await page.pdf(pdfOptions);

      if (dto.webhookUrl) {
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', blob, 'document.pdf');
        await fetch(dto.webhookUrl, {
          method: "POST",
          body: formData,
        });
      }

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  private async hideEverythingBesidesContainer(
    page: Page,
    containerClass: string,
  ) {
    await page.addStyleTag({
      content: `
        @media print {
          body * {
            visibility: hidden !important;
          }

          .${containerClass},
          .${containerClass} * {
            visibility: visible !important;
          }

          .${containerClass} {
            position: absolute;
            top: 0;
            width: 100%;
            left: 50%;
            transform: translateX(-50%);
          }

          /* Prevent clipping */
          * {
            overflow: visible !important;
          }

          /* Disable sticky / fixed elements */
          [style*="position: fixed"],
          [style*="position: sticky"] {
            position: static !important;
          }
        }
      `,
    });
  }
}
