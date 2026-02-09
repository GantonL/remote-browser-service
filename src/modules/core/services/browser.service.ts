import { Injectable, Logger } from "@danet/core";
import { OnAppClose } from "@danet/core/hook";
import puppeteer, { Browser } from "puppeteer";
import process from "node:process";

@Injectable()
export class BrowserService implements OnAppClose {
  private browser: Browser | null = null;
  private isLaunching = false;
  private readonly logger = new Logger(BrowserService.name);
  private killBrowserDebounceTimeout;

  async onAppClose() {
    if (this.browser) {
      this.logger.log("Closing browser instance...");
      await this.browser.close();
      this.browser = null;
    }
  }

  async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      this.idleKill();
      return this.browser;
    }

    this.logger.log("Browser disconnected or not found, relaunching...");
    await this.launch();
    this.debounceKill();
    return this.browser!;
  }

  isAlive(): boolean {
    return !!this.browser?.connected;
  }

  async kill(): Promise<void> {
    await this.browser?.close();
  }

  debounceKill() {
    this.idleKill();
    this.killBrowserDebounceTimeout = setTimeout(
      () => {
        this.logger.log("Browser shutting down on purpose by debounce...");
        this.kill();
      },
      Number(process.env.BROWSER_IDLE_DEBOUNCE_TIME ?? 60000),
    );
  }

  idleKill() {
    clearTimeout(this.killBrowserDebounceTimeout);
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
        await this.browser
          .close()
          .catch((err) => this.logger.error(`Error closing browser: ${err}`));
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
