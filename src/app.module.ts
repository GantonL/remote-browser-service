import { Module } from "@danet/core";
import { HealthController } from "./health.controller.ts";
import { PDFModule } from "./modules/pdf/module.ts";
import { CoreModule } from "./modules/core/module.ts";
import { LoadModule } from "./modules/load/module.ts";

@Module({
  controllers: [HealthController],
  imports: [PDFModule, CoreModule, LoadModule],
})
export class AppModule {}
