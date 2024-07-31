import { AnomaliesReportItem } from "./AnomaliesReportItem.js";
import { ComparisonReportItem } from "./ComparisonReportItem.js";
import { PlaylistItem } from "./PlaylistItem.js";
import { csvStringToObjectArray } from "./utils.js";

export class Playlist {
  constructor(id, date, title, items) {
    this.id = id;
    this.date = date;
    this.title = title;
    this.items = items;
  }

  static generateFromCsvString(csv) {
    const [csvContent, csvMetadata] = csvStringToObjectArray(csv, "\t");
    var items = [];
    for (var i = 0; i < csvContent.length; i++) {
      items.push(new PlaylistItem(csvContent[i]));
    }
    var title = csvMetadata.playlistTitle;
    var id = csvMetadata.playlistId;
    var date = csvMetadata.date;
    return new Playlist(id, date, title, items);
  }

  getCsvString() {
    var csvString = "";

    csvString += "#playlistId\t" + this.id + "\n";
    csvString += "#playlistTitle\t" + this.title + "\n";
    csvString += "#date\t" + this.date + "\n";

    var csvHeader = "";
    for (var key in this.items[0]) {
      if (Object.prototype.hasOwnProperty.call(this.items[0], key)) {
        csvHeader += key + "\t";
      }
    }

    csvString += csvHeader.slice(0, -1) + "\n";

    for (var i = 0; i < this.items.length; i++) {
      csvString += this.items[i].getCsvRow("\t") + "\n";
    }

    return csvString.slice(0, -1);
  }

  getAnomaliesReport(currentRegion) {
    const previousVideoIds = [];
    const anomaliesReport = [];
    var anomaliesReportString = "";

    for (var i = 0; i < this.items.length; i++) {
      if (previousVideoIds.indexOf(this.items[i].id) != -1) {
        anomaliesReport.push(
          new AnomaliesReportItem("Duplicate video", this.items[i])
        );
      } else {
        var availabality = this.items[i].getAvailability(currentRegion);
        if (availabality != "Available") {
          anomaliesReport.push(
            new AnomaliesReportItem(availabality, this.items[i])
          );
        }
      }
      previousVideoIds.push(this.items[i].id);
    }

    anomaliesReportString += AnomaliesReportItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < anomaliesReport.length; i++) {
      anomaliesReportString += anomaliesReport[i].getCsvRow("\t") + "\n";
    }
    return anomaliesReportString.slice(0, -1);
  }

  getComparisonReport(otherPlaylist, currentRegion) {
    var comparisonReportString = "";
    const comparisonReportItems = [];

    var oldPlaylist, newPlaylist;
    if (this.date > otherPlaylist.date) {
      oldPlaylist = otherPlaylist;
      newPlaylist = this;
    } else {
      oldPlaylist = this;
      newPlaylist = otherPlaylist;
    }

    const oldVideoIds = [];
    const newVideoIds = [];

    for (var i = 0; i < oldPlaylist.items.length; i++) {
      oldVideoIds.push(oldPlaylist.items[i].id);
    }
    for (var i = 0; i < newPlaylist.items.length; i++) {
      newVideoIds.push(newPlaylist.items[i].id);
    }

    for (var i = 0; i < oldPlaylist.items.length; i++) {
      var oldPlaylistItem = oldPlaylist.items[i];
      var newPlaylistItemIndex = newVideoIds.indexOf(oldVideoIds[i]);
      if (newPlaylistItemIndex != -1) {
        var newPlaylistItem = newPlaylist.items[newPlaylistItemIndex];
        var comparisonReportItem =
          ComparisonReportItem.generateComparisonReportItem(
            oldPlaylistItem,
            newPlaylistItem,
            currentRegion
          );
        if (
          comparisonReportItem.comparisonType != "OK -> OK" &&
          comparisonReportItem.comparisonType != "KO -> KO"
        )
          comparisonReportItems.push(comparisonReportItem);
      } else {
        comparisonReportItems.push(
          new ComparisonReportItem(
            "Removed video",
            "n/a",
            oldPlaylistItem,
            new PlaylistItem()
          )
        );
      }
    }

    for (var i = 0; i < newPlaylist.items.length; i++) {
      var newPlaylistItem = newPlaylist.items[i];
      var oldPlaylistItemIndex = oldVideoIds.indexOf(newVideoIds[i]);

      if (oldPlaylistItemIndex == -1) {
        var availabality = newPlaylistItem.getAvailability(currentRegion);
        comparisonReportItems.push(
          new ComparisonReportItem(
            availabality == "Available" ? "new OK" : "new KO",
            availabality,
            new PlaylistItem(),
            newPlaylistItem
          )
        );
      }
    }

    comparisonReportItems.sort(ComparisonReportItem.compare);

    comparisonReportString += ComparisonReportItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < comparisonReportItems.length; i++) {
      comparisonReportString += comparisonReportItems[i].getCsvRow("\t") + "\n";
    }
    return comparisonReportString.slice(0, -1);
  }
}
