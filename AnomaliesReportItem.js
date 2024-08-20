import { PlaylistItem } from "./PlaylistItem.js";
import { compareInt, HTMLTableHeaderOf } from "./utils.js";
import { deleteYoutubePlaylistItem } from "./youtube_api.js";

export class AnomaliesReportItem {
  constructor(anomalyType, playlistItem) {
    this.anomalyType = anomalyType;
    this.playlistItem = playlistItem;
  }

  static compare(itemA, itemB) {
    var compare_step = itemA.anomalyType.localeCompare(itemB.anomalyType);
    if (compare_step != 0) {
      return compare_step;
    }
    compare_step = compareInt(
      itemA.playlistItem.position,
      itemB.playlistItem.position
    );
    if (compare_step != 0) {
      return compare_step;
    }
    compare_step = itemA.playlistItem.addedDate.localeCompare(
      itemB.playlistItem.addedDate
    );
    return compare_step;
  }

  getCsvRow(separator) {
    return (
      this.anomalyType + separator + this.playlistItem.getCsvRow(separator)
    );
  }

  static getCsvHeader(separator) {
    return "anomalyType" + separator + PlaylistItem.getCsvHeader(separator);
  }

  getHTMLTableRow(playlistId, requestAuthParam) {
    const tableRow = this.playlistItem.getHTMLTableRow();

    const anomalyTypeCol = document.createElement("td");
    anomalyTypeCol.textContent = this.anomalyType;
    tableRow.prepend(anomalyTypeCol);

    const removeButtonCol = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", async () => {
      deleteYoutubePlaylistItem(
        playlistId,
        this.playlistItem.id,
        requestAuthParam
      );
      tableRow.remove();
    });
    removeButtonCol.append(removeButton);
    tableRow.append(removeButtonCol);

    return tableRow;
  }

  static getHTMLTableHeader() {
    const tableHeader = PlaylistItem.getHTMLTableHeader();

    const anomalyTypeCol = document.createElement("th");
    anomalyTypeCol.textContent = "Anomaly Type";
    tableHeader.prepend(anomalyTypeCol);

    const removeButtonCol = document.createElement("th");
    removeButtonCol.textContent = "button";
    tableHeader.append(removeButtonCol);

    return tableHeader;
  }
}
