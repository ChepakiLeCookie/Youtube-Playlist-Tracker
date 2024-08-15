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
    const tableRow = document.createElement("tr");
    var content = "";
    for (var key in this) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        var val = this[key];
        content += "<td>" + val + "</td>";
      }
    }
    content += "<td><button>Dismiss</button></td>";
    tableRow.innerHTML = content;
    return tableRow;
  }
}
