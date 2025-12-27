import { Module } from "@danet/core";
import { BrowserService } from "./services/browser.service.ts";

@Module({
  injectables: [BrowserService],
})
export class CoreModule {}
