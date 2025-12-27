import { Injectable } from "@danet/core";
import { OnAppBootstrap, OnAppClose } from "@danet/core/hook";
import puppeteer, { Browser } from "puppeteer";

@Injectable()
export class BrowserService implements OnAppBootstrap, OnAppClose {
  private browser: Browser | null = null;
  private isLaunching = false;

  async onAppBootstrap() {
    await this.launch();
  }

  async onAppClose() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    await this.launch();
    return this.browser!;
  }

  private async launch(): Promise<void> {
    if (this.isLaunching) {
      await this.waitForLaunch();
      return;
    }

    this.isLaunching = true;

    try {
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
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
