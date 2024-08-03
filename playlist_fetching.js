import { Playlist } from "./Playlist.js";
import { PlaylistItem } from "./PlaylistItem.js";
import { getFormatedStringDateTime, handleUndefined } from "./utils.js";

const fetchYoutubePlaylistMetadata = async (playlistId) => {
  const response = await fetch(
    "https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=" +
      playlistId +
      "&key=AIzaSyC7hyII1BTSZqajBaGxQZTtAvkPj8sozn4"
  );
  const myJson = await response.json();
  return myJson.items[0].snippet.title;
};

export const fetchYoutubePlaylist = async (playlistId, operationLogArea) => {
  const pageMaxResult = 50; // capped at 50 by the API
  const playlistTitle = await fetchYoutubePlaylistMetadata(playlistId);
  const playlistItems = [];
  var nextPageToken = null;
  // Loop that goes through each 50 video "page". Stops when there's no page left.
  do {
    var currentPagevideoIDs = "";
    const currentPagevideoPartialData = [];

    operationLogArea.textContent =
      "Fetching a page from " +
      playlistTitle +
      ": " +
      (nextPageToken != null ? nextPageToken : "");

    const response = await fetch(
      "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&part=contentDetails&maxResults=" +
        pageMaxResult +
        "&pageToken=" +
        (nextPageToken != null ? nextPageToken : "") +
        "&playlistId=" +
        playlistId +
        "&key=AIzaSyC7hyII1BTSZqajBaGxQZTtAvkPj8sozn4"
    );
    var myJson = await response.json();
    var playlistItemsJson = myJson.items;

    // Loop that goes through each video of the page, to get all video IDs
    for (var i = 0; i < playlistItemsJson.length; i++) {
      var playlistItemJson = playlistItemsJson[i];
      currentPagevideoIDs =
        currentPagevideoIDs + "&id=" + playlistItemJson.contentDetails.videoId;
      currentPagevideoPartialData.push(playlistItemJson);
    }

    const response2 = await fetch(
      "https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=contentDetails&part=status&maxResults=" +
        pageMaxResult +
        currentPagevideoIDs +
        "&key=AIzaSyC7hyII1BTSZqajBaGxQZTtAvkPj8sozn4"
    );
    var myJson2 = await response2.json();
    var playlistItemsJson = myJson2.items;

    // Loop that goes through each video again, this time retrieving all necessary information and creating playlistItem s
    for (var i = 0, j = 0; j < currentPagevideoPartialData.length; i++, j++) {
      var playlistItemJson = playlistItemsJson[i];
      var playlistItemPreviousFetchJson = currentPagevideoPartialData[j];
      var playlistItemData = {};
      playlistItemData.id =
        playlistItemPreviousFetchJson.contentDetails.videoId;
      playlistItemData.title = playlistItemPreviousFetchJson.snippet.title;
      playlistItemData.channelId = handleUndefined(
        playlistItemPreviousFetchJson.snippet.videoOwnerChannelId,
        "n/a"
      );
      playlistItemData.channelTitle = handleUndefined(
        playlistItemPreviousFetchJson.snippet.videoOwnerChannelTitle,
        "n/a"
      );
      playlistItemData.position =
        playlistItemPreviousFetchJson.snippet.position;
      playlistItemData.addedDate =
        playlistItemPreviousFetchJson.snippet.publishedAt;

      // if the video is missing from the second fetch, we add the incomplete info and adjust i to account for the difference in the two fetches
      if (
        playlistItemJson == undefined ||
        playlistItemJson.id !=
          playlistItemPreviousFetchJson.contentDetails.videoId
      ) {
        i--;
        playlistItemData.privacyStatus = "n/a";
        playlistItemData.regionsBlocked = "n/a";
      } else {
        playlistItemData.privacyStatus = playlistItemJson.status.privacyStatus;
        playlistItemData.regionsBlocked = handleUndefined(
          handleUndefined(
            playlistItemJson.contentDetails.regionRestriction,
            "none"
          ).blocked,
          "none"
        );
      }
      playlistItemData.addedDate = playlistItemData.addedDate.slice(0, 10);
      playlistItems.push(new PlaylistItem(playlistItemData));
    }

    nextPageToken = myJson.nextPageToken;
  } while (nextPageToken != null);

  var dateString = getFormatedStringDateTime(new Date());

  const playlist = new Playlist(
    playlistId,
    dateString,
    playlistTitle,
    playlistItems
  );

  return playlist;
};
