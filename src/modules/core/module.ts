import { Module } from "@danet/core";
import { BrowserService } from "./services/browser.service.ts";
import { PageService } from "./services/page.service.ts";

@Module({
  injectables: [BrowserService, PageService],
})
export class CoreModule {}

