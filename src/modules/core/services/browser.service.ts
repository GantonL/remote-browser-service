import { Injectable, Logger } from "@danet/core";
import { OnAppBootstrap, OnAppClose } from "@danet/core/hook";
import puppeteer, { Browser } from "puppeteer";

@Injectable()
export class BrowserService implements OnAppBootstrap, OnAppClose {
  private browser: Browser | null = null;
  private isLaunching = false;
  private readonly logger = new Logger(BrowserService.name);

  async onAppBootstrap() {
    this.logger.log("Bootstrapping BrowserService...");
    await this.launch();
  }

  async onAppClose() {
    if (this.browser) {
      this.logger.log("Closing browser instance...");
      await this.browser.close();
      this.browser = null;
    }
  }

  async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    this.logger.log("Browser disconnected or not found, relaunching...");
    await this.launch();
    return this.browser!;
  }

  private async launch(): Promise<void> {
    if (this.isLaunching) {
      this.logger.log("Browser launch already in progress, waiting...");
      await this.waitForLaunch();
      return;
    }

    this.isLaunching = true;

    try {
      if (this.browser) {
        this.logger.log("Closing existing browser before relaunch...");
        await this.browser.close().catch((err) =>
          this.logger.error(`Error closing browser: ${err}`)
        );
      }

      this.logger.log("Launching new browser instance...");
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      this.logger.log("Browser launched successfully.");
    } catch (e) {
      this.logger.error(`Failed to launch browser: ${e}`);
      throw e;
    } finally {
      this.isLaunching = false;
    }
  }

  private async waitForLaunch(): Promise<void> {
    while (this.isLaunching) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
