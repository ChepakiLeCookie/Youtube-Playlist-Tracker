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

export function downloadReport(playlist, region) {
  var anomaliesReport = playlist.getAnomaliesReport(region);
  download(
    anomaliesReport,
    "REPORT_" + playlist.title + "_" + playlist.date + ".csv",
    "csv"
  );
}

export function downloadComparison(playlist1, playlist2, region) {
  var comparisonReport = playlist1.getComparisonReport(playlist2, region);
  download(
    comparisonReport,
    "COMPARE_" +
      playlist1.title +
      "_" +
      playlist1.date +
      "||VS||" +
      playlist2.date +
      ".csv",
    "csv"
  );
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
