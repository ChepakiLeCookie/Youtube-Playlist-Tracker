import { getReadableStringDateTime } from "./utils.js";

const template = document.createElement("template");
template.innerHTML = `
    <div class="playlist-card">
      <p class="pl-card-title"></p>
      <p class="pl-card-id"></p>
      <p class="pl-card-date"></p>
      <div class="flexRowContainer">
      <button class="fetch">Fetch</button>
      <button class="analyse">Analyse</button>
      <button class="untrack">Stop tracking</button>
      </div>
      <p class="pl-anomalies-number"></p>
      <p class="pl-new-KOs-number"></p>
      <style>
        @import "./main_page.css";
      </style>
    </div>
`;
class PlaylistCardElement extends HTMLElement {
  constructor(fetchMethod, analyseMethod, untrackMethod) {
    super();
    this.fetch = fetchMethod;
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
    this.fetchButton = this.shadowRoot.querySelector(".fetch");
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
      "fetching-state",
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.titleElement.innerText =
      "Playlist title: " + this.getAttribute("playlist-title");
    this.idElement.innerText =
      "Playlist ID: " + this.getAttribute("playlist-id");
    if (name == "backup-date")
      this.dateElement.innerText =
        "Last backup: " +
        getReadableStringDateTime(this.getAttribute("backup-date"));
    this.anomaliesElement.innerText = this.getAttribute("anomalies-number");
    this.kosElement.innerText = this.getAttribute("new-kos-number");

    this.classList.remove("orange");
    this.classList.remove("red");
    if (this.getAttribute("new-kos-number") != "0") {
      this.classList.add("red");
    } else if (this.getAttribute("anomalies-number") != "0") {
      this.classList.add("orange");
    }

    if (this.getAttribute("fetching-state") == "fetching") {
      this.fetchButton.disabled = true;
    } else {
      this.fetchButton.disabled = false;
    }
  }

  connectedCallback() {
    this.untrackButton.addEventListener("click", () => {
      this.untrack(this.getAttribute("playlist-id"));
    });
    this.analyseButton.addEventListener("click", () => {
      this.analyse(this.getAttribute("playlist-id"), this);
    });
    this.fetchButton.addEventListener("click", () => {
      this.fetch(this.getAttribute("playlist-id"), this);
    });
  }

  disconnectedCallback() {}
}

export default PlaylistCardElement;
