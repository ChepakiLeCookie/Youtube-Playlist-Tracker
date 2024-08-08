import { PlaylistItem } from "./PlaylistItem.js";

export class ComparisonReportItem {
  constructor(
    comparisonType,
    currentAvailability,
    oldPlaylistItem,
    newPlaylistItem
  ) {
    this.comparisonType = comparisonType;
    this.currentAvailability = currentAvailability;
    this.oldPlaylistItem = oldPlaylistItem;
    this.newPlaylistItem = newPlaylistItem;
  }

  getCsvRow(separator) {
    return (
      this.comparisonType +
      separator +
      this.currentAvailability +
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
      "currentAvailability" +
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
    compare_step = itemA.currentAvailability.localeCompare(
      itemB.currentAvailability
    );
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
    var oldAvailability = oldPlaylistItem.getAvailability(currentRegion);
    var newAvailability = newPlaylistItem.getAvailability(currentRegion);
    var differencies = oldPlaylistItem.getDifferencies(newPlaylistItem);
    var comparisonReportItem = new ComparisonReportItem(
      "OK -> OK",
      newAvailability,
      oldPlaylistItem,
      newPlaylistItem
    );
    if (differencies != "No change") {
      if (oldAvailability != "Available") {
        if (newAvailability != "Available")
          comparisonReportItem.comparisonType = "KO ~> KO";
        else comparisonReportItem.comparisonType = "KO ~> OK";
      } else {
        if (newAvailability != "Available")
          comparisonReportItem.comparisonType = "OK ~> KO";
        else comparisonReportItem.comparisonType = "OK ~> OK";
      }
      comparisonReportItem.comparisonType += " || " + differencies;
    } else if (oldAvailability != "Available" && newAvailability != "Available")
      comparisonReportItem.comparisonType = "KO -> KO";
    return comparisonReportItem;
  }
}
