import { Body, Controller, HTTP_STATUS, HttpCode, Post } from "@danet/core";
import { PDFService } from "./service.ts";
import { GeneratePDFDto } from "./dto.ts";

@Controller("pdf")
export class PDFController {
  constructor(private readonly service: PDFService) {}

  @Post()
  @HttpCode(HTTP_STATUS.ACCEPTED)
  async generate(@Body() body: GeneratePDFDto) {
    return this.service.generate(body);
  }
}
