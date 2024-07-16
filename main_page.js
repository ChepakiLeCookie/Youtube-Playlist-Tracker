import { Playlist } from "./Playlist.js";
import { fetchYoutubePlaylist } from "./playlist_fetching.js";
import { download } from "./utils.js";

const debugButton = document.querySelector("#debug");
const fetchButton = document.querySelector("#fetch");
const importButton = document.querySelector("#import");
const exportButton = document.querySelector("#export");

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
const regionInput = document.querySelector("#regionInput");

var main_playlist;
var slot1_playlist;
var slot2_playlist;

loadButton1.disabled = true;
loadButton2.disabled = true;
analyseButton.disabled = true;
compareButton.disabled = true;

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
  var anomaliesReport = main_playlist.getAnomaliesReport(regionInput.value);
  download(
    anomaliesReport,
    "REPORT_" + main_playlist.title + "_" + main_playlist.date + ".csv",
    "csv"
  );
  slot1StateDisplay.textContent = main_playlist.title + " has been analysed.";
});

compareButton.addEventListener("click", () => {
  var comparisonReport = slot1_playlist.getComparisonReport(
    slot2_playlist,
    regionInput.value
  );
  download(
    comparisonReport,
    "COMPARE_" +
      slot1_playlist.title +
      "||VS||" +
      slot2_playlist.title +
      ".csv",
    "csv"
  );
  slot1StateDisplay.textContent = "Playlists have been compared";
});

debugButton.addEventListener("click", () => {
  console.log(main_playlist);
  console.log(slot1_playlist);
  console.log(slot2_playlist);
});
