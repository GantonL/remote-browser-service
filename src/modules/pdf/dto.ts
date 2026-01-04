
import { type PDFOptions } from 'puppeteer';
import { IsObject, IsString, IsUrl } from "@danet/core/validation";


export class WebhookDto {
  @IsString()
  // @IsUrl()
  url!: string;

  @IsObject()
  customPayload?: Record<string, unknown>;
}

export class GeneratePDFDto {
  @IsString()
  // @IsUrl()
  url!: string;

  @IsObject()
  webhook!: WebhookDto;
  
  @IsString()
  containerClass!: string;
  
  @IsObject()
  options!: PDFOptions;
}
