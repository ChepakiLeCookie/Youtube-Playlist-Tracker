import { getReadableStringDateTime } from "./utils.js";

const template = document.createElement("template");
const resp = await fetch("./playlistCardElement.html");
const html = await resp.text();
template.innerHTML = html;

class PlaylistCardElement extends HTMLElement {
  constructor(updateMethod, analyseMethod, untrackMethod) {
    super();
    this.update = updateMethod;
    this.untrack = untrackMethod;
    this.analyse = analyseMethod;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.titleElement = this.shadowRoot.querySelector(".pl-card-title");
    this.idElement = this.shadowRoot.querySelector(".pl-card-id");
    this.dateElement = this.shadowRoot.querySelector(".pl-card-date");
    this.anomaliesElement = this.shadowRoot.querySelector(
      ".pl-anomalies-number"
    );
    this.kosElement = this.shadowRoot.querySelector(".pl-new-KOs-number");
    this.updateButton = this.shadowRoot.querySelector(".update");
    this.analyseButton = this.shadowRoot.querySelector(".analyse");
    this.untrackButton = this.shadowRoot.querySelector(".untrack");
  }

  static get observedAttributes() {
    return [
      "playlist-title",
      "playlist-id",
      "backup-date",
      "anomalies-number",
      "new-kos-number",
      "updating-state",
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "playlist-title":
        this.titleElement.innerText = newValue;
        break;
      case "playlist-id":
        this.idElement.innerText = newValue;
        this.idElement.setAttribute(
          "href",
          "https://www.youtube.com/playlist?list=" + newValue
        );
        break;
      case "backup-date":
        this.dateElement.innerText =
          "Last backup: " + getReadableStringDateTime(newValue);
        break;
      case "anomalies-number":
        this.anomaliesElement.innerText = newValue;
        break;
      case "new-kos-number":
        this.kosElement.innerText = newValue;
        break;
      case "updating-state":
        if (newValue == "updating") {
          this.updateButton.disabled = true;
        } else {
          this.updateButton.disabled = false;
        }
        break;
    }
    if (name == "anomalies-number" || name == "new-kos-number") {
      this.classList.remove("orange");
      this.classList.remove("red");
      if (this.getAttribute("new-kos-number") != "0") {
        this.classList.add("red");
      } else if (this.getAttribute("anomalies-number") != "0") {
        this.classList.add("orange");
      }
    }
  }

  connectedCallback() {
    this.untrackButton.addEventListener("click", () => {
      this.untrack(this.getAttribute("playlist-id"));
    });
    this.analyseButton.addEventListener("click", () => {
      this.analyse(this.getAttribute("playlist-id"), this);
    });
    this.updateButton.addEventListener("click", () => {
      this.update(this.getAttribute("playlist-id"), this, true);
    });
  }

  disconnectedCallback() {}
}

export default PlaylistCardElement;
