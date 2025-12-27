import { Injectable } from "@danet/core";
import { BrowserService } from "../core/services/browser.service.ts";

@Injectable()
export class PDFService {
  constructor(private readonly browserService: BrowserService) {}

  async generate() {
    const browser = await this.browserService.getBrowser();
    
  }
}
