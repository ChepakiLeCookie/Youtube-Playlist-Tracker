import { PlaylistItem } from "./PlaylistItem.js";
import { csvStringToObjectArray, download } from "./utils.js";

export class Playlist {
  constructor(id, date, title, items) {
    this.id = id;
    this.date = date;
    this.title = title;
    this.items = items;
  }

  static generateFromJSONObject(JSONObject) {
    var items = [];
    for (var i = 0; i < JSONObject.items.length; i++) {
      items.push(new PlaylistItem(JSONObject.items[i]));
    }
    var title = JSONObject.title;
    var id = JSONObject.id;
    var date = JSONObject.date;
    return new Playlist(id, date, title, items);
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

  download() {
    download(
      this.getCsvString(),
      "BACKUP_" + this.title + "_" + this.date + ".csv",
      "csv"
    );
  }
}
