import { Injectable, Logger } from "@danet/core";
import { BrowserService } from "../core/services/browser.service.ts";
import { GeneratePDFDto, WebhookDto } from "./dto.ts";
import { Browser, Page, PDFOptions } from "puppeteer";
import process from "node:process";

@Injectable()
export class PDFService {
  private readonly logger = new Logger(PDFService.name);

  constructor(private readonly browserService: BrowserService) {}

  async generate(dto: GeneratePDFDto) {
    this.logger.log(`Received PDF generation request for URL: ${dto.url}`);
    const browser = await this.browserService.getBrowser();

    this.generatePdfTask(browser, dto).catch((err) =>
      this.logger.error(`Async PDF generation failed: ${err}`)
    );
    return {
      message: "PDF generation started in background, check webhook for result",
    };
  }

  private async generatePdfTask(browser: Browser, dto: GeneratePDFDto) {
    let page: Page | null = null;
    this.logger.log(`Starting PDF generation task for ${dto.url}`);
    try {
      page = await browser.newPage();
      this.logger.log("New page created");
      
      await page.emulateMediaType("print");
      
      this.logger.log(`Navigating to ${dto.url}...`);
      await page.goto(dto.url, { waitUntil: "networkidle2" });
      this.logger.log("Navigation completed");

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
        this.logger.log(`Hiding everything besides container: ${dto.containerClass}`);
        await this.hideEverythingBesidesContainer(page, dto.containerClass);
      }

      this.logger.log("Generating PDF...");
      const pdfBuffer = await page.pdf(pdfOptions);
      this.logger.log(`PDF generated successfully. Size: ${pdfBuffer.length} bytes`);

      if (dto.webhook) {
        this.logger.log(`Sending success webhook to ${dto.webhook.url}`);
        await this.sendWebhook(dto.webhook, { success: true }, pdfBuffer);
        this.logger.log("Success webhook sent");
      }

      return pdfBuffer;
    } catch (error: unknown) {
        this.logger.error(`PDF generation failed: ${error}`);
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
            
            this.logger.log(`Sending error webhook to ${dto.webhook.url}`);
            await this.sendWebhook(dto.webhook, {
                success: false,
                errorCode,
                errorMessage
            }).catch(err => this.logger.error(`Failed to send error webhook: ${err}`));
        }
    } finally {
      if (page) {
           await page.close().catch(e => this.logger.error(`Error closing page: ${e}`));
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

      const response = await fetch(webhook.url, {
        method: "POST",
        body: formData,
        headers: {
          'Origin': `http://${process.env.RAILWAY_PRIVATE_DOMAIN}:${process.env.PORT}`
        },
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(`Webhook request failed with status ${response.status}: ${text}`);
      } else {
        this.logger.log(`Webhook request successful with status ${response.status}`);
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
