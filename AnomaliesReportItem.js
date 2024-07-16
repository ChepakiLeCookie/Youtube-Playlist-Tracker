import { PlaylistItem } from "./PlaylistItem.js";

export class AnomaliesReportItem {
  constructor(anomalyType, playlistItem) {
    this.anomalyType = anomalyType;
    this.playlistItem = playlistItem;
  }

  getCsvRow(separator) {
    return (
      this.anomalyType + separator + this.playlistItem.getCsvRow(separator)
    );
  }

  static getCsvHeader(separator) {
    return "anomalyType" + separator + PlaylistItem.getCsvHeader(separator);
  }
}
