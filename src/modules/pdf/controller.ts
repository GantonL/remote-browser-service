import { Controller, HTTP_STATUS, HttpCode, Post } from "@danet/core";
import { PDFService } from "./service.ts";

@Controller("pdf")
export class PDFController {
  constructor(private readonly service: PDFService) {}

  @Post()
  @HttpCode(HTTP_STATUS.CREATED)
  generate() {
    return this.service.generate();
  }
}
