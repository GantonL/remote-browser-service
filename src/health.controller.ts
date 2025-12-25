import { Controller, Get, HTTP_STATUS, HttpCode } from "@danet/core";

@Controller("health")
export class HealthController {
  constructor() {}

  @Get()
  @HttpCode(HTTP_STATUS.OK)
  healthCheck() {
    return;
  }
}
