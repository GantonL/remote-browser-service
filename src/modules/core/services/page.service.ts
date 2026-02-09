import { Injectable, Logger } from "@danet/core";
import { BrowserService } from "./browser.service.ts";
import { Page } from "puppeteer";
import { EventEmitter } from "node:events";

@Injectable()
export class PageService extends EventEmitter {
  private activePageCount = 0;
  private readonly MAX_PAGES = 10;
  private pageQueue: Array<(page: Page) => void> = [];
  private readonly logger = new Logger(PageService.name);

  constructor(private readonly browserService: BrowserService) {
    super();
    this.on("page-released", this.processQueue.bind(this));
  }

  async createPage(): Promise<Page> {
    if (this.activePageCount < this.MAX_PAGES) {
      return this.launchPage();
    }

    this.logger.log("Max pages reached. Queuing request...");
    return new Promise((resolve) => {
      this.pageQueue.push(resolve);
    });
  }

  private async launchPage(): Promise<Page> {
    const browser = await this.browserService.getBrowser();
    const page = await browser.newPage();
    this.activePageCount++;
    this.logger.log(`Page created. Active pages: ${this.activePageCount}`);

    page.on("close", () => {
      this.activePageCount--;
      this.logger.log(`Page closed. Active pages: ${this.activePageCount}`);
      this.emit("page-released");
    });

    return page;
  }

  private async processQueue() {
    if (this.pageQueue.length > 0 && this.activePageCount < this.MAX_PAGES) {
      this.logger.log("Processing queued page request...");
      const resolve = this.pageQueue.shift();
      if (resolve) {
        this.browserService.idleKill();
        const page = await this.launchPage();
        resolve(page);
      }
      return;
    }
    if (this.activePageCount === 0) {
      this.browserService.debounceKill();
      return;
    }
  }

  getLoadStats() {
    return {
      active: this.activePageCount,
      queue: this.pageQueue.length,
      max: this.MAX_PAGES,
    };
  }
}
