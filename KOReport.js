import { HTMLTableRowOf } from "./utils.js";

// Simplified comparison report of new KOs
export class KOReport {
  constructor(comparisonReportItem, playlistTitle) {
    if (!comparisonReportItem || !playlistTitle) return;
    this.playlistTitle = playlistTitle;
    this.playlistId = comparisonReportItem.playlistId;
    this.currentStatus = comparisonReportItem.currentStatus;
    this.videoTitle = comparisonReportItem.oldPlaylistItem.title;
    this.videoId = comparisonReportItem.oldPlaylistItem.id;
    this.channelTitle = comparisonReportItem.oldPlaylistItem.channelTitle;
    this.channelId = comparisonReportItem.oldPlaylistItem.channelId;
    this.position = comparisonReportItem.newPlaylistItem.position;
  }

  getUpdatedVersion(playlists) {
    var playlist;
    var item;
    for (var i = 0; i < playlists.length && !playlist; i++)
      if (playlists[i].id == this.playlistId) {
        playlist = playlists[i];
        for (var i = 0; i < playlist.items.length && !item; i++)
          if (playlist.items[i].id == this.videoId) {
            item = playlist.items[i];
            if (item.getStatus() != "Available") {
              this.position = item.position;
              return this;
            }
          }
      }
    globalThis.appLog.log("KO report was removed: " + this);
  }

  static getDummy() {
    globalThis.appLog.log("bitch!!!!");
    var dummy = new KOReport();
    dummy.playlistTitle = "TITRE";
    dummy.playlistId = "oUifjpohuopih65416";
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
    const buttonCol = document.createElement("td");
    const dismissButton = document.createElement("button");
    dismissButton.textContent = "Dismiss";
    buttonCol.append(dismissButton);
    tableRow.append(buttonCol);
    return tableRow;
  }
}
