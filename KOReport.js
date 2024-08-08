// Simplified comparison report of new KOs
export class KOReport {
  constructor(comparisonReportItem) {
    if (!comparisonReportItem) return;
    this.currentAvailability = comparisonReportItem.currentAvailability;
    this.id = comparisonReportItem.oldPlaylistItem.id;
    this.title = comparisonReportItem.oldPlaylistItem.title;
    this.channelId = comparisonReportItem.oldPlaylistItem.channelId;
    this.channelTitle = comparisonReportItem.oldPlaylistItem.channelTitle;
    this.position = comparisonReportItem.newPlaylistItem.position;
  }
}
