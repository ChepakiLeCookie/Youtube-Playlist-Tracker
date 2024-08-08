import { csvRowOf, csvHeaderOf } from "./utils.js";

export class PlaylistItem {
  constructor(constructorData) {
    if (constructorData) Object.assign(this, constructorData);
    else {
      this.id = "n/a";
      this.title = "n/a";
      this.channelId = "n/a";
      this.channelTitle = "n/a";
      this.position = "n/a";
      this.addedDate = "n/a";
      this.privacyStatus = "n/a";
      this.regionsBlocked = "n/a";
    }
  }

  getAvailability(currentRegion) {
    if (this.title == "Private video") return "Private video";
    if (this.title == "Deleted video") return "Deleted video";
    if (this.regionsBlocked.includes(currentRegion))
      return "Blocked in your region";
    return "Available";
  }

  getDifferencies(otherPlaylistItem) {
    var differencies = "";
    if (this.title != otherPlaylistItem.title)
      differencies += "Title changed, ";
    if (this.channelTitle != otherPlaylistItem.channelTitle)
      differencies += "Channel changed, ";
    if (this.regionsBlocked != otherPlaylistItem.regionsBlocked)
      differencies += "Blocked regions changed, ";
    return differencies != "" ? differencies.slice(0, -2) : "No change";
  }

  getCsvRow(separator) {
    return csvRowOf(this, separator);
  }

  static getCsvHeader(separator) {
    return csvHeaderOf(new PlaylistItem(), separator);
  }
}
