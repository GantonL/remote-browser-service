import { Module } from "@danet/core";
import { LoadController } from "./controller.ts";
import { LoadService } from "./service.ts";
import { CoreModule } from "../core/module.ts";

@Module({
  controllers: [LoadController],
  injectables: [LoadService],
  imports: [CoreModule],
})
export class LoadModule {}
