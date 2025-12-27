
import { type PDFOptions } from 'puppeteer';
import { IsObject, IsString, IsUrl } from "@danet/core/validation";

export class GeneratePDFDto {
  @IsString()
  @IsUrl()
  url!: string;

  @IsString()
  @IsUrl()
  webhookUrl!: string;
  
  @IsString()
  containerClass?: string;
  
  @IsObject()
  options?: PDFOptions;
}
