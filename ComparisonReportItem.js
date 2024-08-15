import { PlaylistItem } from "./PlaylistItem.js";

export class ComparisonReportItem {
  constructor(comparisonType, currentStatus, oldPlaylistItem, newPlaylistItem) {
    this.comparisonType = comparisonType;
    this.currentStatus = currentStatus;
    this.oldPlaylistItem = oldPlaylistItem;
    this.newPlaylistItem = newPlaylistItem;
  }

  getCsvRow(separator) {
    return (
      this.comparisonType +
      separator +
      this.currentStatus +
      separator +
      this.oldPlaylistItem.getCsvRow(separator) +
      separator +
      this.newPlaylistItem.getCsvRow(separator)
    );
  }

  static getCsvHeader(separator) {
    return (
      "comparisonType" +
      separator +
      "currentStatus" +
      separator +
      PlaylistItem.getCsvHeader(separator) +
      separator +
      PlaylistItem.getCsvHeader(separator)
    );
  }

  static compare(itemA, itemB) {
    var compare_step = itemA.comparisonType.localeCompare(itemB.comparisonType);
    if (compare_step != 0) {
      return compare_step;
    }
    compare_step = itemA.currentStatus.localeCompare(itemB.currentStatus);
    if (compare_step != 0) {
      return compare_step;
    }
    compare_step = itemA.oldPlaylistItem.id.localeCompare(
      itemB.oldPlaylistItem.id
    );
    return compare_step;
  }

  static generateComparisonReportItem(
    oldPlaylistItem,
    newPlaylistItem,
    currentRegion
  ) {
    var oldStatus = oldPlaylistItem.getStatus(currentRegion);
    var newStatus = newPlaylistItem.getStatus(currentRegion);
    var differencies = oldPlaylistItem.getDifferencies(newPlaylistItem);
    var comparisonReportItem = new ComparisonReportItem(
      "OK -> OK",
      newStatus,
      oldPlaylistItem,
      newPlaylistItem
    );
    if (differencies != "No change") {
      if (oldStatus != "Available") {
        if (newStatus != "Available")
          comparisonReportItem.comparisonType = "KO ~> KO";
        else comparisonReportItem.comparisonType = "KO ~> OK";
      } else {
        if (newStatus != "Available")
          comparisonReportItem.comparisonType = "OK ~> KO";
        else comparisonReportItem.comparisonType = "OK ~> OK";
      }
      comparisonReportItem.comparisonType += " || " + differencies;
    } else if (oldStatus != "Available" && newStatus != "Available")
      comparisonReportItem.comparisonType = "KO -> KO";
    return comparisonReportItem;
  }
}
