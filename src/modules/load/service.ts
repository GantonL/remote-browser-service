import { Injectable } from "@danet/core";
import { PageService } from "../core/services/page.service.ts";
import { LOAD_STATUS_MAPPING, LoadStatus } from "./constants.ts";

@Injectable()
export class LoadService {
  constructor(private readonly pageService: PageService) {}

  getLoadStatus() {
    const stats = this.pageService.getLoadStats();
    const percentage = Math.round((stats.active / stats.max) * 100);

    const status = this.determineStatus(percentage);
    const { message } = LOAD_STATUS_MAPPING[status];

    return {
      percentage: `${percentage}%`,
      status,
      message,
      queue: stats.queue,
    };
  }

  private determineStatus(percentage: number): LoadStatus {
    if (percentage === 0) return LoadStatus.MINIMUM;
    if (percentage <= 30) return LoadStatus.LOW;
    if (percentage <= 70) return LoadStatus.MEDIUM;
    if (percentage < 100) return LoadStatus.HIGH;
    return LoadStatus.EXTREME;
  }
}
