import { PlaylistItem } from "./PlaylistItem.js";
import {
  csvStringToObjectArray,
  download,
  HTMLTableHeaderOf,
} from "./utils.js";

export class Playlist {
  constructor(id, date, title, items) {
    this.id = id;
    this.date = date;
    this.title = title;
    this.items = items;
  }

  static generateFromJSONObject(JSONObject) {
    const playlist = new Playlist();
    Object.assign(playlist, JSONObject);
    playlist.items = [];
    for (var i = 0; i < JSONObject.items.length; i++) {
      playlist.items.push(new PlaylistItem(JSONObject.items[i]));
    }
    return playlist;
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

    csvString += PlaylistItem.getCsvHeader("\t") + "\n";

    for (var i = 0; i < this.items.length; i++) {
      csvString += this.items[i].getCsvRow("\t") + "\n";
    }

    return csvString.slice(0, -1);
  }

  getHTMLTable() {
    const table = document.createElement("table");
    table.append(PlaylistItem.getHTMLTableHeader());
    for (var i = 0; i < this.items.length; i++) {
      table.append(this.items[i].getHTMLTableRow());
    }
    return table;
  }

  getReportTitle() {
    return this.title;
  }

  download() {
    download(
      this.getCsvString(),
      "BACKUP_" + this.title + "_" + this.date + ".csv",
      "csv"
    );
  }
}
