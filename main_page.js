import { Playlist } from "./Playlist.js";
import { fetchYoutubePlaylist } from "./playlist_fetching.js";
import { download, downloadComparison, downloadReport } from "./utils.js";
import PlaylistCardElement from "./PlaylistCardElement.js";

window.customElements.define("playlist-card", PlaylistCardElement);

// LOCAL STORAGE

const localStorageTrackedPlaylists = JSON.parse(
  localStorage.getItem("trackedPlaylists")
);
const trackedPlaylists = [];
if (localStorageTrackedPlaylists) {
  for (var i = 0; i < localStorageTrackedPlaylists.length; i++)
    trackedPlaylists.push(
      Playlist.generateFromJSONObject(localStorageTrackedPlaylists[i])
    );
}

// GET HTML ELEMENTS

const regionInput = document.querySelector("#regionInput");
const trackedPlaylistsDiv = document.querySelector("#tracked-playlists");

const debugButton = document.querySelector("#debug");
const fetchButton = document.querySelector("#fetch");
const importButton = document.querySelector("#import");
const exportButton = document.querySelector("#export");
const trackButton = document.querySelector("#track");

const loadButton1 = document.querySelector("#load1");
const loadButton2 = document.querySelector("#load2");
const compareButton = document.querySelector("#compare");

const slot1StateDisplay = document.querySelector("#slot1StateDisplay");
const slot2StateDisplay = document.querySelector("#slot2StateDisplay");

const analyseButton = document.querySelector("#analyse");

const csvImportElement = document.querySelector("#csvImport");

const titleArea = document.querySelector("#titleArea");
const playlistArea = document.querySelector("#playlistArea");
const playlistIdInput = document.querySelector("#playlistIdInput");

// GENERATE TRACKING SECTION

async function trackedPlaylistFetch(playlistId, playlistCard) {
  playlistCard.setAttribute("fetching-state", "fetching");
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      var oldPlaylist = trackedPlaylists[i];
      var newPlaylist = await fetchYoutubePlaylist(
        playlistId,
        playlistCard.kosElement
      );
      var newKOsNumber =
        oldPlaylist
          .getComparisonReport(newPlaylist, regionInput.value)
          .split("\n").length - 1;
      var anomalies_number =
        newPlaylist.getAnomaliesReport(regionInput.value).split("\n").length -
        1;
      downloadComparison(oldPlaylist, newPlaylist, regionInput.value);
      playlistCard.setAttribute("new-kos-number", newKOsNumber);
      playlistCard.setAttribute("playlist-title", newPlaylist.title);
      playlistCard.setAttribute("backup-date", newPlaylist.date);
      playlistCard.setAttribute("anomalies-number", anomalies_number);

      trackedPlaylists[i] = newPlaylist;
    }
  }
  playlistCard.setAttribute("fetching-state", "done");
}

function trackedPlaylistAnalyse(playlistId, playlistCard) {
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      downloadReport(trackedPlaylists[i], regionInput.value);
      playlistCard.setAttribute("anomalies-number", "Analysed.");
    }
  }
}

function trackedPlaylistUntrack(playlistId) {
  const previousTrackedPlaylists = Array.from(trackedPlaylists);
  trackedPlaylists.length = 0;
  while (trackedPlaylistsDiv.firstChild) {
    trackedPlaylistsDiv.removeChild(trackedPlaylistsDiv.lastChild);
  }
  for (var i = 0; i < previousTrackedPlaylists.length; i++) {
    if (previousTrackedPlaylists[i].id != playlistId)
      trackedPlaylists.push(previousTrackedPlaylists[i]);
  }
  localStorage.setItem("trackedPlaylists", JSON.stringify(trackedPlaylists));
}

function addPlaylistCardElementToDiv(playlist) {
  if (!playlist || !playlist.title || !playlist.id) {
    console.log("Attempt to add card element failed.");
    return;
  }
  var anomalies_number =
    playlist.getAnomaliesReport(regionInput.value).split("\n").length - 1;
  const playlistCardElement = new PlaylistCardElement(
    trackedPlaylistFetch,
    trackedPlaylistAnalyse,
    trackedPlaylistUntrack
  );
  playlistCardElement.setAttribute("playlist-title", playlist.title);
  playlistCardElement.setAttribute("playlist-id", playlist.id);
  playlistCardElement.setAttribute("backup-date", playlist.date);
  playlistCardElement.setAttribute("anomalies-number", anomalies_number);
  playlistCardElement.setAttribute("new-kos-number", "No new KO's");

  trackedPlaylistsDiv.append(playlistCardElement);
}

for (var i = 0; i < trackedPlaylists.length; i++) {
  addPlaylistCardElementToDiv(trackedPlaylists[i]);
}

function processPush(processedPlaylist) {
  localStorage.setItem("trackedPlaylists", JSON.stringify(trackedPlaylists));
  addPlaylistCardElementToDiv(processedPlaylist);
}

trackedPlaylists.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processPush(arguments[0]);
};

// INITS

var main_playlist;
var slot1_playlist;
var slot2_playlist;

loadButton1.disabled = true;
loadButton2.disabled = true;
analyseButton.disabled = true;
compareButton.disabled = true;

// EVENT LISTENERS

function displayPlaylist(playlist) {
  playlistArea.textContent = playlist.getCsvString();
  titleArea.textContent = playlist.title;
  loadButton1.disabled = false;
  loadButton2.disabled = false;
  analyseButton.disabled = false;
}

fetchButton.addEventListener("click", async () => {
  main_playlist = await fetchYoutubePlaylist(
    playlistIdInput.value,
    playlistArea
  );
  displayPlaylist(main_playlist);
});

csvImportElement.addEventListener("change", async () => {
  const [file] = csvImportElement.files;
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      main_playlist = Playlist.generateFromCsvString(reader.result);
      displayPlaylist(main_playlist);
      if (slot1_playlist == undefined) {
        loadButton1.click();
      } else if (slot2_playlist == undefined) {
        loadButton2.click();
      }
    },
    false
  );

  if (file) {
    reader.readAsText(file);
  }
});

importButton.addEventListener("click", async () => {
  csvImportElement.click();
});

trackButton.addEventListener("click", async () => {
  trackedPlaylists.push(main_playlist);
});

exportButton.addEventListener("click", async () => {
  download(
    main_playlist.getCsvString(),
    "BACKUP_" + main_playlist.title + "_" + main_playlist.date + ".csv",
    "csv"
  );
});

loadButton1.addEventListener("click", () => {
  slot1_playlist = main_playlist;
  slot1StateDisplay.textContent = slot1_playlist.title + " has been loaded.";
  if (slot2_playlist != undefined) compareButton.disabled = false;
});

loadButton2.addEventListener("click", () => {
  slot2_playlist = main_playlist;
  slot2StateDisplay.textContent = slot2_playlist.title + " has been loaded.";
  if (slot1_playlist != undefined) compareButton.disabled = false;
});

analyseButton.addEventListener("click", () => {
  downloadReport(main_playlist, regionInput.value);
  slot1StateDisplay.textContent = main_playlist.title + " has been analysed.";
});

compareButton.addEventListener("click", () => {
  downloadComparison(slot1_playlist, slot2_playlist, regionInput.value);
  slot1StateDisplay.textContent = "Playlists have been compared";
});

debugButton.addEventListener("click", () => {
  localStorage.clear();
});
