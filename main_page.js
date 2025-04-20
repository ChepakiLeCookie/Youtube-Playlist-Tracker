import {
  fetchYoutubePlaylist,
  oauthSignIn,
  replacePlaylistItem,
} from "./youtube_api.js";
import { Playlist } from "./Playlist.js";
import { ComparisonReport } from "./ComparisonReport.js";
import { AnomaliesReport } from "./AnomaliesReport.js";
import { KOReport } from "./KOReport.js";
import PlaylistCardElement from "./PlaylistCardElement.js";
import { checkAndGetId, download, HTMLTableRowOf } from "./utils.js";
import { AppLog } from "./AppLog.js";
import { getFormatedStringDateTime } from "./utils.js";

window.customElements.define("playlist-card", PlaylistCardElement);

// GET HTML ELEMENTS

const elementsWithIds = document.querySelectorAll('[id]:not([id=""])');
const elmtsById = {};

for (var i = 0; i < elementsWithIds.length; i++) {
  const elem = elementsWithIds[i];
  elmtsById[elem.id] = elem;
}

// INITS

var main_playlist;

const pendingReports = [];

var access_token;
var token_expiration_date;
var api_key;
var requestAuthParam;

const KOReports = [];
const trackedPlaylists = [];

const appLog = new AppLog(elmtsById.logDiv);
globalThis.appLog = appLog;

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
  localStorage.setItem("tokenExpirationDate", token_expiration_date);
  localStorage.setItem("apiKey", api_key);
}

function saveStoredDataBackup() {
  const backup = {};
  backup.apiKey = localStorage.getItem("apiKey");
  backup.accessToken = localStorage.getItem("accessToken");
  backup.tokenExpirationDate = localStorage.getItem("tokenExpirationDate");
  backup.trackedPlaylists = JSON.parse(
    localStorage.getItem("trackedPlaylists")
  );
  backup.KOReports = JSON.parse(localStorage.getItem("KOReports"));
  download(
    JSON.stringify(backup),
    "BACKUP_YTPlaylistTracker_" +
      getFormatedStringDateTime(new Date()) +
      ".json",
    "json"
  );
}

function loadStoredDataBackup(backup) {
  if (!confirm("Import backup and overwrite current data?")) return;
  localStorage.setItem(
    "trackedPlaylists",
    JSON.stringify(backup.trackedPlaylists)
  );
  localStorage.setItem("KOReports", JSON.stringify(backup.KOReports));
  localStorage.setItem("accessToken", backup.accessToken);
  localStorage.setItem("tokenExpirationDate", backup.tokenExpirationDate);
  localStorage.setItem("apiKey", backup.apiKey);
  window.location.reload();
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
  elmtsById.trackedPlaylistsSection.style.display =
    elmtsById.utilitiesSection.style.display =
      trackedPlaylists.length == 0 ? "none" : "flex";
}

function updateKOSectionDisplay() {
  elmtsById.KOSection.style.display = KOReports.length == 0 ? "none" : "flex";
}

function updateReportsSectionDisplay() {
  elmtsById.reportsSection.style.display =
    pendingReports.length == 0 ? "none" : "flex";
  elmtsById.downloadReportsButton.disabled = pendingReports.length == 0;
  elmtsById.pendingReportsAmountSpan.textContent = pendingReports.length;
}

function updateAuthSectionDisplay() {
  elmtsById.apiKeyInput.value = api_key;
  elmtsById.authStateArea.textContent = access_token
    ? "Connected until: " + token_expiration_date
    : "Not connected";
}

function updateMainPlaylistDisplay() {
  elmtsById.playlistArea.textContent = main_playlist.getCsvString();
  elmtsById.playlistIdInput.value = main_playlist.id;
  elmtsById.titleArea.textContent = main_playlist.title;
  elmtsById.analyseButton.disabled = false;
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
  elmtsById.displaySection.children[1].replaceChildren(
    report.getHTMLTable(requestAuthParam)
  );

  elmtsById.displayName.innerText = " - " + report.getReportTitle();
  elmtsById.displaySection.style.display = "flex";
}

updateRequestAuthParam();

updateTrackedPlaylistDisplay();
updateKOSectionDisplay();
updateAuthSectionDisplay();

// GENERATE TRACKING SECTION

async function trackedPlaylistUpdate(playlistId, playlistCard, updatingAll) {
  playlistCard.setAttribute("updating-state", "updating");
  const region = elmtsById.regionInput.value;
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
        region
      );
      const anomaliesReport = new AnomaliesReport(newPlaylist, region);
      const newKOs = comparisonReport.getNewKOsOnly();
      for (var j = 0; j < newKOs.length; j++) {
        var newKO = newKOs[j];
        KOReports.push(new KOReport(newKO, newPlaylist.title, newPlaylist.id));
        appLog.log(
          "New KO: " + newKO.currentStatus + " | " + newKO.oldPlaylistItem.title
        );
      }
      var anomalies_number = anomaliesReport.items.length;
      if (updatingAll) {
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
      playlistCard.setAttribute("videos-number", newPlaylist.items.length);
      playlistCard.setAttribute("anomalies-number", anomalies_number);

      trackedPlaylists[i] = newPlaylist;
    }
  }
  updateStoredData();
  playlistCard.setAttribute("updating-state", "done");
}

function trackedPlaylistDisplay(playlistId) {
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      displayReport(trackedPlaylists[i]);
      return;
    }
  }
}

function trackedPlaylistAnalyse(playlistId, playlistCard) {
  for (var i = 0; i < trackedPlaylists.length; i++) {
    if (trackedPlaylists[i].id == playlistId) {
      const report = new AnomaliesReport(
        trackedPlaylists[i],
        elmtsById.regionInput.value
      );
      pendingReports.push(report);
      updateReportsSectionDisplay();
      displayReport(report);
      return;
    }
  }
}

function trackedPlaylistUntrack(playlistId) {
  if (
    !confirm(
      "Stop tracking this playlist? It's current backup won't be stored anymore."
    )
  )
    return;
  const previousTrackedPlaylists = Array.from(trackedPlaylists);
  trackedPlaylists.length = 0;
  while (elmtsById.trackedPlaylistsDiv.firstChild) {
    elmtsById.trackedPlaylistsDiv.removeChild(
      elmtsById.trackedPlaylistsDiv.lastChild
    );
  }
  for (var i = 0; i < previousTrackedPlaylists.length; i++) {
    if (previousTrackedPlaylists[i].id != playlistId)
      trackedPlaylists.push(previousTrackedPlaylists[i]);
  }
  updateStoredData();
  updateTrackedPlaylistDisplay();
  globalThis.appLog.log("Stopped tracking playlist " + playlistId);
}

function addPlaylistCardElementToDiv(playlist) {
  if (!playlist || !playlist.title || !playlist.id) {
    appLog.log("Attempt to add card element failed.");
    return;
  }
  const anomaliesReport = new AnomaliesReport(
    playlist,
    elmtsById.regionInput.value
  );
  const playlistCardElement = new PlaylistCardElement(
    trackedPlaylistUpdate,
    trackedPlaylistDisplay,
    trackedPlaylistAnalyse,
    trackedPlaylistUntrack
  );
  playlistCardElement.setAttribute("playlist-title", playlist.title);
  playlistCardElement.setAttribute("playlist-id", playlist.id);
  playlistCardElement.setAttribute("backup-date", playlist.date);
  playlistCardElement.setAttribute("videos-number", playlist.items.length);
  playlistCardElement.setAttribute(
    "anomalies-number",
    anomaliesReport.items.length
  );
  playlistCardElement.setAttribute("new-kos-number", 0);

  elmtsById.trackedPlaylistsDiv.append(playlistCardElement);
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
    appLog.log("Push failed. (Tracked playlists)");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processPlaylistPush(arguments[0]);
};

// GENERATE KOTABLE

function addKOReportToTable(KOReport, i) {
  const KOReportElement = KOReport.getHTMLTableRow();
  var indexToRemove = i ? i : KOReports.length - 1;
  KOReportElement.querySelector(".dismissButton").addEventListener(
    "click",
    () => {
      dismissKOReport(indexToRemove);
    }
  );
  elmtsById.KOTable.append(KOReportElement);
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
    appLog.log("Push failed. (KO Reports)");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processKOReportPush(arguments[0]);
};

function dismissKOReport(index) {
  const previousKOReports = Array.from(KOReports);
  KOReports.length = 0;
  for (var i = 0; i < previousKOReports.length; i++) {
    elmtsById.KOTable.removeChild(elmtsById.KOTable.lastChild);
  }
  for (var i = 0; i < previousKOReports.length; i++) {
    if (i != index) KOReports.push(previousKOReports[i]);
  }
  updateStoredData();
  updateKOSectionDisplay();

  globalThis.appLog.log(
    "Dismissed KOReport: " + JSON.stringify(previousKOReports[index])
  );
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

  elmtsById.reportsTable.append(reportRowElement);
}

function processReportPush(processedReport) {
  addReportToTable(processedReport);
  updateReportsSectionDisplay();
}

pendingReports.push = function () {
  if (!arguments[0]) {
    appLog.log("Push failed. (Reports)");
    return;
  }
  Array.prototype.push.apply(this, arguments);
  processReportPush(arguments[0]);
};

// EVENT LISTENERS

elmtsById.apiKeyInput.addEventListener("input", () => {
  api_key = elmtsById.apiKeyInput.value;
  localStorage.setItem("apiKey", api_key);
  updateRequestAuthParam();
});

elmtsById.fetchButton.addEventListener("click", async () => {
  var id = checkAndGetId(elmtsById.playlistIdInput.value, "playlist");
  if (!id) return;
  main_playlist = await fetchYoutubePlaylist(
    id,
    elmtsById.playlistArea,
    requestAuthParam
  );
  updateMainPlaylistDisplay();
});

elmtsById.csvImportInput.addEventListener("change", async () => {
  const [file] = elmtsById.csvImportInput.files;
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      main_playlist = Playlist.generateFromCsvString(reader.result);
      updateMainPlaylistDisplay();
    },
    false
  );

  if (file) {
    reader.readAsText(file);
  }
});

elmtsById.importButton.addEventListener("click", async () => {
  elmtsById.csvImportInput.click();
});

elmtsById.trackButton.addEventListener("click", async () => {
  trackedPlaylists.push(main_playlist);
});

elmtsById.exportButton.addEventListener("click", async () => {
  main_playlist.download();
});

elmtsById.analyseButton.addEventListener("click", () => {
  new AnomaliesReport(main_playlist, elmtsById.regionInput.value).download();
  appLog.log(main_playlist.title + " has been analysed.");
});

elmtsById.updateAllButton.addEventListener("click", () => {
  const playlistCards =
    elmtsById.trackedPlaylistsDiv.getElementsByTagName("playlist-card");
  for (var i = 0; i < playlistCards.length; i++) {
    playlistCards[i].updateButton.click();
  }
});

elmtsById.replaceButton.addEventListener("click", async () => {
  elmtsById.replaceButton.disabled = true;
  var targetId = checkAndGetId(elmtsById.targetInput.value, "video");
  var replacementId = checkAndGetId(elmtsById.replacementInput.value, "video");
  if (!targetId || !replacementId) return;
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
  elmtsById.replaceButton.disabled = false;
});

elmtsById.updateKOreportsButton.addEventListener("click", async () => {
  elmtsById.updateKOreportsButton.disabled = true;
  const oldKOReports = [...KOReports];
  KOReports.length = 0;
  for (var i = 0; i < oldKOReports.length; i++) {
    elmtsById.KOTable.removeChild(elmtsById.KOTable.lastChild);
  }
  for (var i = 0; i < oldKOReports.length; i++) {
    KOReports.push(
      oldKOReports[i].getUpdatedVersion(
        trackedPlaylists,
        elmtsById.regionInput.value
      )
    );
  }
  updateStoredData();
  updateKOSectionDisplay();
  elmtsById.updateKOreportsButton.disabled = false;
});

elmtsById.downloadReportsButton.addEventListener("click", () => {
  for (var i = 0; i < pendingReports.length; i++) {
    pendingReports[i].download();
  }
  pendingReports.length = 0;
  updateReportsSectionDisplay();
});

elmtsById.saveButton.addEventListener("click", () => {
  saveStoredDataBackup();
});
elmtsById.loadButton.addEventListener("click", () => {
  elmtsById.backupImportInput.click();
});

elmtsById.backupImportInput.addEventListener("change", async () => {
  const [file] = elmtsById.backupImportInput.files;
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      loadStoredDataBackup(JSON.parse(reader.result));
    },
    false
  );

  if (file) {
    reader.readAsText(file);
  }
});

elmtsById.connectButton.addEventListener("click", async () => {
  oauthSignIn();
});

elmtsById.debugButton.addEventListener("click", async () => {
  appLog.log(checkAndGetId(elmtsById.playlistIdInput.value, "playlist"));
});
