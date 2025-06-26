export function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

export function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

export function handleUndefined(handled, backup) {
  return handled != undefined ? handled : backup;
}

// for youtube data (video and channel names) \t is the only valid separator to avoid incorrect data
export function csvStringToObjectArray(csv, separator) {
  var result = [];
  var metadata = {};
  var headersLine = 0;

  var lines = csv.split("\n");

  for (var i = 0, isComment = true; isComment; i++) {
    if (Array.from(lines[i])[0] == "#") {
      var singleMetadata = lines[i].slice(1).split(separator);
      metadata[singleMetadata[0]] = singleMetadata[1];
    } else {
      isComment = false;
      headersLine = i;
    }
  }

  var headers = lines[headersLine].split(separator);

  for (var i = headersLine + 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(separator);

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return [result, metadata];
}

export function setTextFromFile(file, targetElement) {
  const reader = new FileReader();
  reader.addEventListener(
    "load",
    () => {
      targetElement.textContent = reader.result;
    },
    false
  );

  if (file) {
    reader.readAsText(file);
  }
}

export function getFormatedStringDateTime(date) {
  var dd = String(date.getDate()).padStart(2, "0");
  var mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0
  var yyyy = date.getFullYear();
  var HH = String(date.getHours()).padStart(2, "0");
  var MM = String(date.getMinutes()).padStart(2, "0");
  return yyyy + mm + dd + HH + MM;
}

export function getReadableStringDateTime(formatedDate) {
  var yyyy = formatedDate.slice(0, 4);
  var mm = formatedDate.slice(4, 6);
  var dd = formatedDate.slice(6, 8);
  var HH = formatedDate.slice(8, 10);
  var MM = formatedDate.slice(10, 12);
  return yyyy + "/" + mm + "/" + dd + " at " + HH + "h" + MM;
}

// generates a row of csv data containing all of the properties of the object. Tabulations necessary as separator for youtube data compatibility
export function csvRowOf(object, separator) {
  var csvRow = "";
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      var val = object[key];
      csvRow += val + separator;
    }
  }
  csvRow = csvRow.slice(0, -1);
  return csvRow;
}

// generates the header of a csv file containing all of the properties of the object. Tabulations necessary as separator for youtube data compatibility
export function csvHeaderOf(object, separator) {
  var csvHeader = "";
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      csvHeader += key + separator;
    }
  }
  csvHeader = csvHeader.slice(0, -1);
  return csvHeader;
}

export function HTMLTableRowOf(object) {
  const tableRow = document.createElement("tr");
  var content = "";
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      var val = object[key];
      var insideCell;
      var classAndVal = " class=" + key + "Cell>" + val;
      if (key == "id" || key == "videoId") {
        insideCell = "<button" + classAndVal + "</button>";
      } else if (key == "channelId") {
        insideCell =
          "<a href=https://www.youtube.com/channel/" +
          val +
          classAndVal +
          "</a>";
      } else if (key == "playlistId") {
        insideCell =
          "<a href=https://www.youtube.com/playlist?list=" +
          val +
          classAndVal +
          "</a>";
      } else {
        insideCell = "<div class=" + key + "Cell>" + val + "</div>";
      }
      content += "<td>" + insideCell + "</td>";
    }
  }
  tableRow.innerHTML = content;
  const idButton = tableRow.querySelector(".idCell, .videoIdCell");
  if (idButton) {
    idButton.addEventListener("click", () => {
      navigator.clipboard.writeText(idButton.textContent);
    });
  }
  return tableRow;
}

export function HTMLTableHeaderOf(object) {
  const tableHeader = document.createElement("tr");
  var content = "";
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      content += "<th class=" + key + "Col>" + key + "</th>";
    }
  }
  tableHeader.innerHTML = content;
  return tableHeader;
}

//true if two arrays contain the same data, same order
export function assertArraysEquals(array1, array2) {
  if (!array1 || !array2) return false;
  if (array1 === array2) return true;
  if (array2.length != array1.length) return false;

  for (var i = 0, l = array2.length; i < l; i++) {
    if (array2[i] instanceof Array && array1[i] instanceof Array) {
      if (!assertArraysEquals(array1, array2)) return false;
    } else if (array2[i] != array1[i]) return false;
  }
  return true;
}

export function compareInt(int1, int2) {
  int1 = parseInt(int1);
  int2 = parseInt(int2);
  if (int1 > int2) return 1;
  if (int2 > int1) return -1;
  return 0;
}

export function handleAPIresponse(response, errorMessage) {
  if (response.status < 200 || response.status > 299) {
    throw new Error(globalThis.appLog.log(errorMessage));
  }
}

export function checkAndGetId(string, expectedType) {
  var result;
  switch (expectedType) {
    case "playlist":
      result = string.split("list=").pop().slice(0, 34);
      if (result.length == 34) return result;
      break;
    case "video":
      result = string
        .split("shorts/")
        .pop()
        .split("watch?v=")
        .pop()
        .slice(0, 11);
      if (result.length == 11) return result;
      break;
    case "channel":
      break; //unused and complicated
    default:
  }
  globalThis.appLog.log("Invalid ID or link doesn't contain valid ID");
}

export function checkAccessTokenValidity(accessToken, tokenExpirationDate) {
  if (accessToken && tokenExpirationDate > new Date()) return true;
}

function getEveryVideo(playlists) {
  const every_video = {};
  for (var i = 0; i < playlists.length; i++) {
    var playlist = playlists[i];
    for (var j = 0; j < playlist.items.length; j++) {
      var playlistItem = playlist.items[j];
      if (
        playlistItem.title != "Deleted video" &&
        playlistItem.title != "Private video"
      ) {
        if (!every_video[playlistItem.title]) {
          every_video[playlistItem.title] = {};
          every_video[playlistItem.title].playlists = [];
          every_video[playlistItem.title].ids = [];
        }
        every_video[playlistItem.title].playlists.push(playlist.title);
        if (!every_video[playlistItem.title].ids.includes(playlistItem.id))
          every_video[playlistItem.title].ids.push(playlistItem.id);
      }
    }
  }
  return every_video;
}

function getVideosWithSameTitles(every_video) {
  const every_duplicate_title = {};

  for (var key in every_video) {
    if (Object.prototype.hasOwnProperty.call(every_video, key)) {
      if (every_video[key].ids.length > 1) {
        every_duplicate_title[key] = every_video[key];
      }
    }
  }

  return every_duplicate_title;
}

export function getFoobarScript(playlists) {
  var script = "";
  const every_video = getEveryVideo(playlists);
  const every_duplicate_title = getVideosWithSameTitles(every_video);
  console.log(every_video);
  console.log(every_duplicate_title);

  for (var key in every_video) {
    var line = '"C:\\Program Files\\foobar2000\\foobar2000.exe" /tag:tags="';
    if (Object.prototype.hasOwnProperty.call(every_video, key)) {
      for (var i = 0; i < every_video[key].playlists.length; i++) {
        line += every_video[key].playlists[i] + "\\";
      }
      var key_no_quotes = key.replaceAll('"', "＂");
      line = line.slice(0, -1) + '" "' + key_no_quotes + '.mp3"\n';
      script += line;
    }
  }

  return script;
}

// ('"C:\\Program Files\\foobar2000\\foobar2000.exe" /tag:tags="betifu\\mr   pre\\tty" "Flow.mp3" "Firebugs.mp3"');
