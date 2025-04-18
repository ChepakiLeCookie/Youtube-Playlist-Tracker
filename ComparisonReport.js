import { ComparisonReportItem } from "./ComparisonReportItem.js";
import { PlaylistItem } from "./PlaylistItem.js";
import { download } from "./utils.js";

export class ComparisonReport {
  constructor(playlist1, playlist2, currentRegion) {
    const comparisonReportItems = [];

    var newPlaylist;
    var oldPlaylist;

    if (playlist1.date > playlist2.date) {
      oldPlaylist = playlist2;
      newPlaylist = playlist1;
    } else {
      oldPlaylist = playlist1;
      newPlaylist = playlist2;
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
        var availabality = newPlaylistItem.getStatus(currentRegion);
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

    this.oldPlaylist = oldPlaylist;
    this.newPlaylist = newPlaylist;
    this.items = comparisonReportItems;
    this.region = currentRegion;
  }

  getNewKOsOnly() {
    const newKOs = [];
    for (var i = 0; i < this.items.length; i++) {
      if (
        this.items[i].comparisonType.includes("OK ~> KO") ||
        this.items[i].comparisonType.includes("new KO") ||
        (this.items[i].comparisonType.includes("Title changed") &&
          (this.items[i].currentStatus == "Deleted video" ||
            this.items[i].currentStatus == "Private video"))
      )
        // the last check gets videos that were already KOs but had their info still available
        newKOs.push(this.items[i]);
    }
    return newKOs;
  }

  getNewKOsNumber() {
    return this.getNewKOsOnly().length;
  }

  getCsvString() {
    var csvString = "";

    csvString += ComparisonReportItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < this.items.length; i++) {
      csvString += this.items[i].getCsvRow("\t") + "\n";
    }
    return csvString.slice(0, -1);
  }

  getHTMLTable() {
    const table = document.createElement("table");
    table.append(ComparisonReportItem.getHTMLTableHeader());
    for (var i = 0; i < this.items.length && i < 500; i++) {
      table.append(this.items[i].getHTMLTableRow());
    }
    return table;
  }

  getReportTitle() {
    return this.oldPlaylist.title + " - Comparaison report";
  }

  download() {
    if (this.items.length == 0) return "No items in this report.";
    download(
      this.getCsvString(),
      "COMPARE_" +
        this.newPlaylist.title +
        "_" +
        this.oldPlaylist.date +
        "||VS||" +
        this.newPlaylist.date +
        ".csv",
      "csv"
    );
  }
}
