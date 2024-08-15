import { Playlist } from "./Playlist.js";
import { fetchYoutubePlaylist } from "./playlist_fetching.js";
import PlaylistCardElement from "./PlaylistCardElement.js";
import { ComparisonReport } from "./ComparisonReport.js";
import { AnomaliesReport } from "./AnomaliesReport.js";
import { KOReport } from "./KOReport.js";

window.customElements.define("playlist-card", PlaylistCardElement);

// GET HTML ELEMENTS

const regionInput = document.querySelector("#regionInput");
const trackedPlaylistsDiv = document.querySelector("#tracked-playlists");
const fetchAllButton = document.querySelector("#fetch-all");
const trackedPlaylistsSection = document.querySelector(
  "#trackedPlaylistsSection"
);

const KOTable = document.querySelector("#KOTable");

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

// LOCAL STORAGE

const localStorageTrackedPlaylists = JSON.parse(
  localStorage.getItem("trackedPlaylists")
);
const localStorageKOReports = JSON.parse(localStorage.getItem("KOReports"));

const KOReports = [];
const trackedPlaylists = [];
if (localStorageTrackedPlaylists) {
  for (var i = 0; i < localStorageTrackedPlaylists.length; i++)
    trackedPlaylists.push(
      Playlist.generateFromJSONObject(localStorageTrackedPlaylists[i])
    );
}
if (localStorageKOReports) {
  for (var i = 0; i < localStorageKOReports.length; i++)
    KOReports.push(Object.assign(new KOReport(), localStorageKOReports[i]));
}

function updateStoredData() {
  localStorage.setItem("trackedPlaylists", JSON.stringify(trackedPlaylists));
  localStorage.setItem("KOReports", JSON.stringify(KOReports));
  trackedPlaylistsSection.style.display =
    trackedPlaylists.length == 0 ? "none" : "flex";
}

updateStoredData();

// INITS

var main_playlist;
var slot1_playlist;
var slot2_playlist;

loadButton1.disabled = true;
loadButton2.disabled = true;
analyseButton.disabled = true;
compareButton.disabled = true;

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
      const comparisonReport = new ComparisonReport(
        oldPlaylist,
        newPlaylist,
        regionInput.value
      );
      const anomaliesReport = new AnomaliesReport(
        newPlaylist,
        regionInput.value
      );
      const newKOs = comparisonReport.getNewKOsOnly();
      for (var i = 0; i < newKOs.length; i++) {
        KOReports.push(new KOReport(newKOs[i], newPlaylist.title));
      }
      var anomalies_number = anomaliesReport.items.length;
      newPlaylist.download();
      comparisonReport.download();
      playlistCard.setAttribute("new-kos-number", newKOs.length);
      playlistCard.setAttribute("playlist-title", newPlaylist.title);
      playlistCard.setAttribute("backup-date", newPlaylist.date);
      playlistCard.setAttribute("anomalies-number", anomalies_number);

      trackedPlaylists[i] = newPlaylist;
    }
  }
  updateStoredData();
  playlistCard.setAttribute("fetching-state", "done");
}

function trackedPlaylistAnalyse(playlistId, playlistCard) {
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      new AnomaliesReport(trackedPlaylists[i], regionInput.value).download();
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
  updateStoredData();
}

function addPlaylistCardElementToDiv(playlist) {
  if (!playlist || !playlist.title || !playlist.id) {
    console.log("Attempt to add card element failed.");
    return;
  }
  const anomaliesReport = new AnomaliesReport(playlist, regionInput.value);
  var anomalies_number = anomaliesReport.getCsvString().split("\n").length - 1;
  const playlistCardElement = new PlaylistCardElement(
    trackedPlaylistFetch,
    trackedPlaylistAnalyse,
    trackedPlaylistUntrack
  );
  playlistCardElement.setAttribute("playlist-title", playlist.title);
  playlistCardElement.setAttribute("playlist-id", playlist.id);
  playlistCardElement.setAttribute("backup-date", playlist.date);
  playlistCardElement.setAttribute("anomalies-number", anomalies_number);
  playlistCardElement.setAttribute("new-kos-number", 0);

  trackedPlaylistsDiv.append(playlistCardElement);
}

for (var i = 0; i < trackedPlaylists.length; i++) {
  addPlaylistCardElementToDiv(trackedPlaylists[i]);
}

function processPlaylistPush(processedPlaylist) {
  updateStoredData();
  addPlaylistCardElementToDiv(processedPlaylist);
}

trackedPlaylists.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processPlaylistPush(arguments[0]);
};

// GENERATE KOTABLE

function addKOReportToTable(KOReport) {
  KOTable.append(KOReport.getHTMLTableRow());
}

console.log(KOReports);
for (var i = 0; i < KOReports.length; i++) {
  addKOReportToTable(KOReports[i]);
}

function processKOReportPush(processedKOReport) {
  updateStoredData();
  addKOReportToTable(processedKOReport);
}

KOReports.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processKOReportPush(arguments[0]);
};

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
  main_playlist.download();
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
  new AnomaliesReport(main_playlist, regionInput.value).download();
  slot1StateDisplay.textContent = main_playlist.title + " has been analysed.";
});

compareButton.addEventListener("click", () => {
  new ComparisonReport(
    slot1_playlist,
    slot2_playlist,
    regionInput.value
  ).download();
  slot1StateDisplay.textContent = "Playlists have been compared";
});

fetchAllButton.addEventListener("click", () => {
  const playlistCards =
    trackedPlaylistsDiv.getElementsByTagName("playlist-card");
  for (var i = 0; i < playlistCards.length; i++) {
    playlistCards[i].fetchButton.click();
  }
});

debugButton.addEventListener("click", () => {
  KOReports.push(KOReport.getDummy());
});
