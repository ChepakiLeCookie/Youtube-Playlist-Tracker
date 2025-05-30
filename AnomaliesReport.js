import { AnomaliesReportItem } from "./AnomaliesReportItem.js";
import { download } from "./utils.js";

export class AnomaliesReport {
  constructor(playlist, currentRegion) {
    const previousVideoIds = [];
    const anomaliesReport = [];

    for (var i = 0; i < playlist.items.length; i++) {
      if (previousVideoIds.indexOf(playlist.items[i].id) != -1) {
        anomaliesReport.push(
          new AnomaliesReportItem("Duplicate video", playlist.items[i])
        );
      } else {
        var availabality = playlist.items[i].getStatus(currentRegion);
        if (availabality != "Available") {
          anomaliesReport.push(
            new AnomaliesReportItem(availabality, playlist.items[i])
          );
        }
      }
      previousVideoIds.push(playlist.items[i].id);
    }

    anomaliesReport.sort(AnomaliesReportItem.compare);

    this.playlist = playlist;
    this.region = currentRegion;
    this.items = anomaliesReport;
  }

  getCsvString() {
    var csvString = "";

    csvString += AnomaliesReportItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < this.items.length; i++) {
      csvString += this.items[i].getCsvRow("\t") + "\n";
    }
    return csvString.slice(0, -1);
  }

  getHTMLTable(requestAuthParam) {
    const table = document.createElement("table");
    table.append(AnomaliesReportItem.getHTMLTableHeader());
    for (var i = 0; i < this.items.length; i++) {
      table.append(
        this.items[i].getHTMLTableRow(this.playlist.id, requestAuthParam)
      );
    }
    return table;
  }

  getReportTitle() {
    return this.playlist.title + " - Anomalies report";
  }

  download() {
    if (this.items.length == 0) return "No items in this report.";
    download(
      this.getCsvString(),
      "REPORT_" + this.playlist.title + "_" + this.playlist.date + ".csv",
      "csv"
    );
  }
}
