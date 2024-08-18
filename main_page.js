import { Playlist } from "./Playlist.js";
import { oauthSignIn } from "./authentification.js";
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
const downloadReportsButton = document.querySelector("#downloadReports");
const pendingReportsAmountSpan = document.querySelector("#reportsAmount");

const KOTable = document.querySelector("#KOTable");
const KOSection = document.querySelector("#KOSection");

const displaySection = document.querySelector("#DisplaySection");

const debugButton = document.querySelector("#debug");
const debugButton2 = document.querySelector("#debug2");
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

// INITS

const pendingReports = [];

var main_playlist;
var slot1_playlist;
var slot2_playlist;

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
}

// DISPLAY UPDATES

function updatePendingReportsDisplay() {
  downloadReportsButton.disabled = pendingReports.length == 0;
  pendingReportsAmountSpan.textContent = pendingReports.length;
}

function updateTrackedPlaylistDisplay() {
  trackedPlaylistsSection.style.display =
    trackedPlaylists.length == 0 ? "none" : "flex";
}

function updateKOSectionDisplay() {
  KOSection.style.display = KOReports.length == 0 ? "none" : "flex";
}

updateTrackedPlaylistDisplay();
updateKOSectionDisplay();

// GENERATE TRACKING SECTION

async function trackedPlaylistFetch(playlistId, playlistCard, fetchingAll) {
  playlistCard.setAttribute("fetching-state", "fetching");
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      const oldPlaylist = trackedPlaylists[i];
      const newPlaylist = await fetchYoutubePlaylist(
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
      for (var j = 0; j < newKOs.length; j++) {
        KOReports.push(new KOReport(newKOs[j], newPlaylist.title));
      }
      var anomalies_number = anomaliesReport.items.length;
      if (fetchingAll) {
        if (comparisonReport.items.length != 0)
          pendingReports.push(comparisonReport);
        pendingReports.push(newPlaylist);
        updatePendingReportsDisplay();
      } else {
        newPlaylist.download();
        comparisonReport.download();
      }
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
  updateTrackedPlaylistDisplay();
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
  updateTrackedPlaylistDisplay();
}

trackedPlaylists.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  console.log(this);
  console.log(arguments);

  Array.prototype.push.apply(this, arguments);
  processPlaylistPush(arguments[0]);
};

// GENERATE KOTABLE

function addKOReportToTable(KOReport) {
  const KOReportElement = KOReport.getHTMLTableRow();
  var indexToRemove = KOReports.length - 1;
  KOReportElement.querySelector("button").addEventListener("click", () => {
    dismissKOReport(indexToRemove);
  });
  KOTable.append(KOReportElement);
}

for (var i = 0; i < KOReports.length; i++) {
  addKOReportToTable(KOReports[i]);
}

function processKOReportPush(processedKOReport) {
  updateStoredData();
  addKOReportToTable(processedKOReport);
  updateKOSectionDisplay();
}

KOReports.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  console.log(this);
  console.log(arguments);

  Array.prototype.push.apply(this, arguments);
  processKOReportPush(arguments[0]);
};

function dismissKOReport(index) {
  const previousKOReports = Array.from(KOReports);
  KOReports.length = 0;
  for (var i = 0; i < previousKOReports.length; i++) {
    KOTable.removeChild(KOTable.lastChild);
  }
  for (var i = 0; i < previousKOReports.length; i++) {
    if (i != index) KOReports.push(previousKOReports[i]);
  }
  updateStoredData();
  updateKOSectionDisplay();
}

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

downloadReportsButton.addEventListener("click", () => {
  for (var i = 0; i < pendingReports.length; i++) {
    pendingReports[i].download();
  }
  pendingReports.length = 0;
  updatePendingReportsDisplay();
});

debugButton.addEventListener("click", () => {
  // displaySection.append(
  //   new AnomaliesReport(main_playlist, regionInput.value).getHTMLTable()
  // );
  // displaySection.style.display = "flex";
  oauthSignIn();
});

debugButton2.addEventListener("click", async () => {
  var accessToken = regionInput.value;
  var playlistItemId =
    "UExfSl8tbG05YmxDNV9oS0VKYVRoLUM1ODUwcldnNzdJTS4wMTcyMDhGQUE4NTIzM0Y5";
  const response = await fetch(
    "https://youtube.googleapis.com/youtube/v3/playlistItems?id=" +
      playlistItemId +
      "&access_token=" +
      accessToken,
    { method: "DELETE" }
  );
  const myJson = await response.json();
  console.log(response);
  console.log(myJson);
});
