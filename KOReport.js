import { HTMLTableRowOf } from "./utils.js";

// Simplified comparison report of new KOs
export class KOReport {
  constructor(comparisonReportItem, playlistTitle) {
    if (!comparisonReportItem || !playlistTitle) return;
    this.playlistTitle = playlistTitle;
    this.currentStatus = comparisonReportItem.currentStatus;
    this.videoTitle = comparisonReportItem.oldPlaylistItem.title;
    this.videoId = comparisonReportItem.oldPlaylistItem.id;
    this.channelTitle = comparisonReportItem.oldPlaylistItem.channelTitle;
    this.channelId = comparisonReportItem.oldPlaylistItem.channelId;
    this.position = comparisonReportItem.newPlaylistItem.position;
  }

  static getDummy() {
    var dummy = new KOReport();
    dummy.playlistTitle = "TITRE";
    dummy.currentStatus = "comparisonReportItem.currentStatus";
    dummy.videoTitle = "comparisonReportItem.oldPlaylistItem.title";
    dummy.videoId = "comparisonReportItem.oldPlaylistItem.id";
    dummy.channelTitle = "comparisonReportItem.oldPlaylistItem.channelTitle";
    dummy.channelId = "comparisonReportItem.oldPlaylistItem.channelId";
    dummy.position = new Date().toUTCString();
    return dummy;
  }

  getHTMLTableRow() {
    const tableRow = HTMLTableRowOf(this);
    const dismissButton = document.createElement("button");
    dismissButton.textContent = "Dismiss";
    tableRow.append(dismissButton);
    return tableRow;
  }
}
