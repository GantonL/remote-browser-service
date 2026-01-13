import { Controller, Get } from "@danet/core";
import { LoadService } from "./service.ts";

@Controller("load")
export class LoadController {
  constructor(private readonly loadService: LoadService) {}

  @Get()
  getLoadStatus() {
    return this.loadService.getLoadStatus();
  }
}

