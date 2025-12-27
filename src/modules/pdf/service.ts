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
        format: dto.options?.format ?? "A4",
        ...dto.options,
        path: "test.pdf",
      };

      if (dto.containerClass) {
        await this.hideEverythingBesidesContainer(page, dto.containerClass);
      }

      const pdfBuffer = await page.pdf(pdfOptions);

      if (dto.webhookUrl) {
        await fetch(dto.webhookUrl, {
          method: "POST",
          body: pdfBuffer,
          headers: { "Content-Type": "application/pdf" },
        });
        return;
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
