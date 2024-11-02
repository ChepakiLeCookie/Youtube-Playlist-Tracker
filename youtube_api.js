import { Playlist } from "./Playlist.js";
import { PlaylistItem } from "./PlaylistItem.js";
import {
  getFormatedStringDateTime,
  handleAPIresponse,
  handleUndefined,
} from "./utils.js";

const baseAPIurl = "https://youtube.googleapis.com/youtube/v3/";

async function fetchYoutubePlaylistMetadata(playlistId, requestAuthParam) {
  const response = await fetch(
    baseAPIurl +
      "playlists?part=snippet&id=" +
      playlistId +
      "&" +
      requestAuthParam
  );
  const responseContent = await response.json();
  handleAPIresponse(
    response,
    "Playlist wasn't found: " + JSON.stringify(responseContent)
  );
  return responseContent.items[0].snippet.title;
}

export async function fetchYoutubePlaylist(
  playlistId,
  operationLogElement,
  requestAuthParam
) {
  const pageMaxResult = 50; // capped at 50 by the API
  const playlistTitle = await fetchYoutubePlaylistMetadata(
    playlistId,
    requestAuthParam
  );
  const playlistItems = [];
  var nextPageToken = null;
  // Loop that goes through each 50 video "page". Stops when there's no page left.
  do {
    var currentPagevideoIDs = "";
    const currentPagevideoPartialData = [];

    operationLogElement.textContent =
      "Fetching a page from " +
      playlistTitle +
      ": " +
      (nextPageToken != null ? nextPageToken : "");

    const response = await fetch(
      baseAPIurl +
        "playlistItems?part=snippet&part=contentDetails&maxResults=" +
        pageMaxResult +
        "&pageToken=" +
        (nextPageToken != null ? nextPageToken : "") +
        "&playlistId=" +
        playlistId +
        "&" +
        requestAuthParam
    );
    var responseContent = await response.json();
    var playlistItemsJson = responseContent.items;

    // Loop that goes through each video of the page, to get all video IDs
    for (var i = 0; i < playlistItemsJson.length; i++) {
      var playlistItemJson = playlistItemsJson[i];
      currentPagevideoIDs += "&id=" + playlistItemJson.contentDetails.videoId;
      currentPagevideoPartialData.push(playlistItemJson);
    }

    const response2 = await fetch(
      baseAPIurl +
        "videos?part=snippet&part=contentDetails&part=status&maxResults=" +
        pageMaxResult +
        currentPagevideoIDs +
        "&" +
        requestAuthParam
    );
    var responseContent2 = await response2.json();
    var playlistItemsJson = responseContent2.items;

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
        ).toString();
      }
      playlistItemData.addedDate = playlistItemData.addedDate.slice(0, 10);
      playlistItems.push(new PlaylistItem(playlistItemData));
    }

    nextPageToken = responseContent.nextPageToken;
  } while (nextPageToken != null);

  var dateString = getFormatedStringDateTime(new Date());

  const playlist = new Playlist(
    playlistId,
    dateString,
    playlistTitle,
    playlistItems
  );

  return playlist;
}

export function oauthSignIn() {
  var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  var form = document.createElement("form");
  form.setAttribute("method", "GET"); // Send as a GET request.
  form.setAttribute("action", oauth2Endpoint);

  var params = {
    client_id:
      "116365897040-jmu3p8uo4h677a9ev57uag1fqruq274t.apps.googleusercontent.com",
    redirect_uri: "https://chepakilecookie.github.io/Youtube-Playlist-Tracker",
    response_type: "token",
    scope: "https://www.googleapis.com/auth/youtube",
    include_granted_scopes: "true",
    state: "pass-through value",
  };

  for (var p in params) {
    var input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

async function getPlaylistItemId(playlistId, videoId, requestAuthParam) {
  /*
  var response = await fetch(
    "https://youtube.googleapis.com/youtube/v3/playlistItems?maxResults=1&playlistId=" + playlistId + "&videoId=" + videoId + "&" + requestAuthParam
  );
  This SHOULD be enough, if youtube's api wasn't stupid about deleted and private videos. A simple request on the playlist items of a playlist will return everything, with the deleted/private videos and their IDs, but for some reason requesting ONLY one of those playlist items (by adding videoId=....) will result in a 404 video not found error. So with that, our other option is to go through every playlistItem and get the id of the one corresponding to our video id
  */
  var nextPageToken = null;
  do {
    var response = await fetch(
      baseAPIurl +
        "playlistItems?maxResults=50&part=contentDetails&pageToken=" +
        (nextPageToken != null ? nextPageToken : "") +
        "&playlistId=" +
        playlistId +
        "&" +
        requestAuthParam
    );
    var responseContent = await response.json();
    handleAPIresponse(
      response,
      "Video wasn't found: " + JSON.stringify(responseContent)
    );

    nextPageToken = responseContent.nextPageToken;
    var playlistItemsJson = responseContent.items;

    for (var i = 0; i < playlistItemsJson.length; i++) {
      var id = playlistItemsJson[i].contentDetails.videoId;
      if (id == videoId) {
        return playlistItemsJson[i].id;
      }
    }
  } while (nextPageToken != null);
}

export async function deleteYoutubePlaylistItem(
  playlistId,
  videoId,
  requestAuthParam
) {
  var playlistItemId = await getPlaylistItemId(
    playlistId,
    videoId,
    requestAuthParam
  );
  var response = await fetch(
    baseAPIurl + "playlistItems?id=" + playlistItemId + "&" + requestAuthParam,
    { method: "DELETE" }
  );
  handleAPIresponse(
    response,
    "Video couldn't be removed from playlist: " +
      JSON.stringify(await response.json())
  );
}

export async function insertYoutubeVideo(
  playlistId,
  videoId,
  requestAuthParam
) {
  var body = {
    snippet: {
      playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId,
      },
    },
  };
  var response = await fetch(
    baseAPIurl + "playlistItems?part=snippet&" + requestAuthParam,
    { method: "POST", body: JSON.stringify(body) }
  );
  handleAPIresponse(
    response,
    "Video couldn't be added from playlist: " +
      JSON.stringify(await response.json())
  );
}

export async function replacePlaylistItem(
  playlistId,
  targetVideoId,
  replacementVideoId,
  requestAuthParam
) {
  // todo: old/new video exists
  await insertYoutubeVideo(playlistId, replacementVideoId, requestAuthParam);
  await deleteYoutubePlaylistItem(playlistId, targetVideoId, requestAuthParam);
}
