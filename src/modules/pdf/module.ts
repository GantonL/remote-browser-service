import { Module } from "@danet/core";
import { PDFController as Controller } from "./controller.ts";
import { PDFService as Service } from "./service.ts";

@Module({
  controllers: [Controller],
  injectables: [Service],
})
export class PDFModule {}
