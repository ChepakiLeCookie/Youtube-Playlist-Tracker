import {
  fetchYoutubePlaylist,
  insertYoutubeVideo,
  oauthSignIn,
  replacePlaylistItem,
  replacePlaylistItemAllPlaylists,
} from "./youtube_api.js";
import { Playlist } from "./Playlist.js";
import { ComparisonReport } from "./ComparisonReport.js";
import { AnomaliesReport } from "./AnomaliesReport.js";
import { KOReport } from "./KOReport.js";
import PlaylistCardElement from "./PlaylistCardElement.js";
import { HTMLTableRowOf } from "./utils.js";

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

const KOSection = document.querySelector("#KOSection");
const KOTable = document.querySelector("#KOTable");

const reportsSection = document.querySelector("#reportsSection");
const reportsTable = document.querySelector("#reportsTable");

const replaceSection = document.querySelector("#replaceSection");
const targetInput = document.querySelector("#targetInput");
const replacementInput = document.querySelector("#replacementInput");
const replaceButton = document.querySelector("#replace");

const displaySection = document.querySelector("#displaySection");

const apiKeyInput = document.querySelector("#apiKeyInput");
const authStateArea = document.querySelector("#authStateArea");

const debugButton = document.querySelector("#debug");
const connectButton = document.querySelector("#connect");
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

var main_playlist;
var slot1_playlist;
var slot2_playlist;

const pendingReports = [];

var access_token;
var token_expiration_date;
var api_key;
var requestAuthParam;

const KOReports = [];
const trackedPlaylists = [];

// LOCAL STORAGE

api_key = localStorage.getItem("apiKey");
access_token = localStorage.getItem("accessToken");

const localStorageExpirationDate = new Date(
  Date.parse(localStorage.getItem("tokenExpirationDate"))
);
if (!isNaN(localStorageExpirationDate))
  token_expiration_date = localStorageExpirationDate;

const localStorageTrackedPlaylists = JSON.parse(
  localStorage.getItem("trackedPlaylists")
);
const localStorageKOReports = JSON.parse(localStorage.getItem("KOReports"));

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
  localStorage.setItem("accessToken", access_token);
  localStorage.setItem("apiKey", api_key);
}

// URL PARAMS

const urlParams = new URLSearchParams(window.location.href);
var param;
if ((param = urlParams.get("access_token"))) {
  access_token = param;
  localStorage.setItem("accessToken", access_token);
}
if ((param = urlParams.get("expires_in"))) {
  var expiresIn = param;
  token_expiration_date = new Date();
  token_expiration_date.setSeconds(
    token_expiration_date.getSeconds() + parseInt(expiresIn)
  );
  localStorage.setItem("tokenExpirationDate", token_expiration_date);
}

window.history.replaceState(null, "", window.location.pathname);

// DISPLAY UPDATES

function updateTrackedPlaylistDisplay() {
  trackedPlaylistsSection.style.display = replaceSection.style.display =
    trackedPlaylists.length == 0 ? "none" : "flex";
}

function updateKOSectionDisplay() {
  KOSection.style.display = KOReports.length == 0 ? "none" : "flex";
}

function updateReportsSectionDisplay() {
  reportsSection.style.display = pendingReports.length == 0 ? "none" : "flex";
  downloadReportsButton.disabled = pendingReports.length == 0;
  pendingReportsAmountSpan.textContent = pendingReports.length;
}

function updateAuthSectionDisplay() {
  apiKeyInput.value = api_key;
  authStateArea.textContent = access_token
    ? "Connected until: " + token_expiration_date
    : "Not connected";
}

function updateMainPlaylistDisplay() {
  playlistArea.textContent = main_playlist.getCsvString();
  playlistIdInput.value = main_playlist.id;
  titleArea.textContent = main_playlist.title;
  loadButton1.disabled = false;
  loadButton2.disabled = false;
  analyseButton.disabled = false;
}

function updateRequestAuthParam() {
  if (!token_expiration_date || new Date() > token_expiration_date) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpirationDate");
    access_token = undefined;
    token_expiration_date = undefined;
  }
  requestAuthParam = access_token
    ? "access_token=" + access_token
    : "key=" + api_key;
}

function displayReport(report) {
  displaySection.children[1].replaceChildren(
    report.getHTMLTable(requestAuthParam)
  );
  displaySection.style.display = "flex";
}

updateRequestAuthParam();

updateTrackedPlaylistDisplay();
updateKOSectionDisplay();
updateAuthSectionDisplay();

// GENERATE TRACKING SECTION

async function trackedPlaylistFetch(playlistId, playlistCard, fetchingAll) {
  playlistCard.setAttribute("fetching-state", "fetching");
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      const oldPlaylist = trackedPlaylists[i];
      const newPlaylist = await fetchYoutubePlaylist(
        playlistId,
        playlistCard.kosElement,
        requestAuthParam
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
        updateReportsSectionDisplay();
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
      const report = new AnomaliesReport(
        trackedPlaylists[i],
        regionInput.value
      );
      pendingReports.push(report);
      updateReportsSectionDisplay();
      playlistCard.setAttribute("anomalies-number", "Analysed.");
      displayReport(report);
      return;
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
  Array.prototype.push.apply(this, arguments);
  processPlaylistPush(arguments[0]);
};

// GENERATE KOTABLE

function addKOReportToTable(KOReport, i) {
  const KOReportElement = KOReport.getHTMLTableRow();
  var indexToRemove = i ? i : KOReports.length - 1;
  KOReportElement.querySelector("button").addEventListener("click", () => {
    dismissKOReport(indexToRemove);
  });
  KOTable.append(KOReportElement);
}

for (var i = 0; i < KOReports.length; i++) {
  addKOReportToTable(KOReports[i], i);
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

// GENERATE REPORTSTABLE

function addReportToTable(report) {
  var type,
    playlistTitle,
    playlistId = "n/a";
  if (report instanceof AnomaliesReport) {
    type = "Anomalies report";
    playlistTitle = report.playlist.title;
    playlistId = report.playlist.id;
  } else if (report instanceof ComparisonReport) {
    type = "Comparison report";
    playlistTitle = report.newPlaylist.title;
    playlistId = report.newPlaylist.id;
  } else if (report instanceof Playlist) {
    type = "Playlist backup";
    playlistTitle = report.title;
    playlistId = report.id;
  }

  const reportRowObject = { type, playlistTitle, playlistId };
  const reportRowElement = HTMLTableRowOf(reportRowObject);

  const displayButtonCol = document.createElement("td");
  const displayButton = document.createElement("button");
  displayButton.textContent = "Display";
  displayButton.addEventListener("click", async () => {
    displayReport(report);
  });
  displayButtonCol.append(displayButton);
  reportRowElement.append(displayButtonCol);

  const downloadButtonCol = document.createElement("td");
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "Download";
  downloadButton.addEventListener("click", async () => {
    report.download();
  });
  downloadButtonCol.append(downloadButton);
  reportRowElement.append(downloadButtonCol);

  reportsTable.append(reportRowElement);
}

function processReportPush(processedReport) {
  addReportToTable(processedReport);
  updateReportsSectionDisplay();
}

pendingReports.push = function () {
  if (!arguments[0]) {
    console.log("Push failed.");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processReportPush(arguments[0]);
};

// EVENT LISTENERS

apiKeyInput.addEventListener("input", () => {
  api_key = apiKeyInput.value;
  localStorage.setItem("apiKey", api_key);
  updateRequestAuthParam();
});

fetchButton.addEventListener("click", async () => {
  main_playlist = await fetchYoutubePlaylist(
    playlistIdInput.value,
    playlistArea,
    requestAuthParam
  );
  updateMainPlaylistDisplay();
});

csvImportElement.addEventListener("change", async () => {
  const [file] = csvImportElement.files;
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      main_playlist = Playlist.generateFromCsvString(reader.result);
      updateMainPlaylistDisplay();
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

replaceButton.addEventListener("click", async () => {
  var targetId = targetInput.value;
  var replacementId = replacementInput.value;
  for (var i = 0; i < trackedPlaylists.length; i++) {
    const playlist = trackedPlaylists[i];
    for (var j = 0; j < playlist.items.length; j++) {
      if (playlist.items[j].id == targetId) {
        await replacePlaylistItem(
          playlist.id,
          targetId,
          replacementId,
          requestAuthParam
        );
      }
    }
  }
});

downloadReportsButton.addEventListener("click", () => {
  for (var i = 0; i < pendingReports.length; i++) {
    pendingReports[i].download();
  }
  pendingReports.length = 0;
  updateReportsSectionDisplay();
});

debugButton.addEventListener("click", () => {
  var dummy = KOReport.getDummy();
  dummy.playlistTitle = KOReports.length;
  KOReports.push(dummy);
});

connectButton.addEventListener("click", async () => {
  oauthSignIn();
});
