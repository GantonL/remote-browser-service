import { Injectable } from "@danet/core";
import { BrowserService } from "../core/services/browser.service.ts";
import { GeneratePDFDto, WebhookDto } from "./dto.ts";
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
    let page: Page | null = null;
    try {
      page = await browser.newPage();
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

      if (dto.webhook) {
        await this.sendWebhook(dto.webhook, { success: true }, pdfBuffer);
      }

      return pdfBuffer;
    } catch (error: unknown) {
        console.error("PDF generation failed", error);
        if (dto.webhook) {
            let errorCode = "UNKNOWN_ERROR";
            let errorMessage = "An unknown error occurred";

            if (error instanceof Error) {
                errorMessage = error.message;
                // Simple heuristic for error codes
                if (errorMessage.includes("net::")) {
                     errorCode = "NAVIGATION_FAILED";
                } else if (errorMessage.includes("Protocol error")) {
                    errorCode = "BROWSER_CONNECTION_FAILED";
                } else if (errorMessage.includes("PrintToPDF")) {
                    errorCode = "PDF_GENERATION_FAILED";
                }
            }
            
            await this.sendWebhook(dto.webhook, {
                success: false,
                errorCode,
                errorMessage
            }).catch(err => console.error("Failed to send error webhook", err));
        }
    } finally {
      if (page) {
           await page.close().catch(e => console.error("Error closing page", e));
      }
    }
  }

  private async sendWebhook(
      webhook: WebhookDto, 
      statusPayload: Record<string, unknown>, 
      pdfBuffer?: Uint8Array
  ) {
      const formData = new FormData();
      
      if (pdfBuffer) {
        const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
        formData.append('file', blob, 'document.pdf');
      }

      const payload = {
          ...webhook.customPayload,
          ...statusPayload
      };

      for (const [key, value] of Object.entries(payload)) {
            formData.append(key, String(value));
      }

      await fetch(webhook.url, {
        method: "POST",
        body: formData,
      });
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
