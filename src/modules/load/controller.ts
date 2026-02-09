import { Controller, Get, HTTP_STATUS, HttpCode, Post } from "@danet/core";
import { LoadService } from "./service.ts";

@Controller("load")
export class LoadController {
  constructor(private readonly loadService: LoadService) {}

  @Get()
  getLoadStatus() {
    return this.loadService.getLoadStatus();
  }

  @Post("prepare")
  @HttpCode(HTTP_STATUS.OK)
  prepareForLoad() {
    return this.loadService.prepareForLoad();
  }

  @Post("reset")
  @HttpCode(HTTP_STATUS.OK)
  reset() {
    return this.loadService.reset();
  }
}
