import { Module } from "@danet/core";
import { CoreModule } from "../core/module.ts";

import { PDFController as Controller } from "./controller.ts";
import { PDFService as Service } from "./service.ts";

@Module({
  imports: [CoreModule],
  controllers: [Controller],
  injectables: [Service],
})
export class PDFModule {}
