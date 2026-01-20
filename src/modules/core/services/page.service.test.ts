import { assertEquals } from "@std/assert";
import { PageService } from "./page.service.ts";
import { BrowserService } from "./browser.service.ts";
import { Page, Browser } from "puppeteer";
import { EventEmitter } from "node:events";

// Mock Page
class MockPage extends EventEmitter {
  async close() {
    this.emit("close");
  }
}

// Mock Browser
class MockBrowser {
  async newPage() {
    return new MockPage() as unknown as Page;
  }
}

// Mock BrowserService
class MockBrowserService {
  async getBrowser() {
    return new MockBrowser() as unknown as Browser;
  }
}

Deno.test("PageService - Load and Queue Logic", async (t) => {
  const browserService = new MockBrowserService() as unknown as BrowserService;
  const pageService = new PageService(browserService);

  await t.step("should create pages up to limit", async () => {
    const pages: Page[] = [];
    for (let i = 0; i < 10; i++) {
        const page = await pageService.createPage();
        pages.push(page);
    }
    
    const stats = pageService.getLoadStats();
    assertEquals(stats.active, 10);
    assertEquals(stats.queue, 0);
  });

  await t.step("should queue requests when limit reached", async () => {
    // We already have 10 pages from previous step
    let queuedPageResolved = false;
    
    const pPromise = pageService.createPage().then((p) => {
        queuedPageResolved = true;
        return p;
    });

    const stats = pageService.getLoadStats();
    assertEquals(stats.active, 10);
    assertEquals(stats.queue, 1);
    assertEquals(queuedPageResolved, false);

    // Now release one page
    // We need to access one of the created pages (but I didn't save them in a scope accessible here easily unless I rely on internal state or just mocking differently)
    // Actually I can access them if I saved them.
  });
});

Deno.test("PageService - Queue Processing", async () => {
  const browserService = new MockBrowserService() as unknown as BrowserService;
  const pageService = new PageService(browserService);
  const pages: Page[] = [];

  // Fill up capacity
  for (let i = 0; i < 10; i++) {
    pages.push(await pageService.createPage());
  }

  // Queue one
  let queuedPage: Page | undefined;
  const queuePromise = pageService.createPage().then(p => queuedPage = p);

  assertEquals(pageService.getLoadStats().queue, 1);
  assertEquals(pageService.getLoadStats().active, 10);

  // Close one page
  await pages[0].close();

  // Wait for queue logic
  await queuePromise;

  assertEquals(pageService.getLoadStats().queue, 0);
  assertEquals(pageService.getLoadStats().active, 10);
  assertEquals(!!queuedPage, true);
});
