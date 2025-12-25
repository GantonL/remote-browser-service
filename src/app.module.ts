import { Module } from "@danet/core";
import { HealthController } from "./health.controller.ts";
import { PDFModule } from "./modules/pdf/module.ts";

@Module({
  controllers: [HealthController],
  imports: [PDFModule],
})
export class AppModule {}
