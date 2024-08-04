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

    this.oldPlaylist = oldPlaylist;
    this.newPlaylist = newPlaylist;
    this.items = comparisonReportItems;
    this.region = currentRegion;
  }

  getNewKOsNumber() {
    var newKOsNumber = 0;
    for (var i = 0; i < this.items.length; i++) {
      if (
        this.items[i].comparisonType == "OK ~> KO" ||
        this.items[i].comparisonType == "new KO"
      )
        newKOsNumber++;
    }
    return newKOsNumber;
  }

  getCsvString() {
    var csvString = "";

    csvString += ComparisonReportItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < this.items.length; i++) {
      csvString += this.items[i].getCsvRow("\t") + "\n";
    }
    return csvString.slice(0, -1);
  }

  download() {
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
