const template = document.createElement("template");
template.innerHTML = `
    <div class="playlist-card">
      <p class="pl-card-title"></p>
      <p class="pl-card-id"></p>
      <button class="untrack">Stop tracking</button>
    </div>
`;
class PlaylistCardElement extends HTMLElement {
  constructor(untrackMethod) {
    super();
    this.untrack = untrackMethod;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ["playlist-title", "playlist-id"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.shadowRoot.querySelector(".pl-card-title").innerText =
      this.getAttribute("playlist-title");
    this.shadowRoot.querySelector(".pl-card-id").innerText =
      this.getAttribute("playlist-id");
  }

  connectedCallback() {
    this.shadowRoot.querySelector(".untrack").addEventListener("click", () => {
      this.untrack(this.getAttribute("playlist-id"));
    });
  }

  disconnectedCallback() {}
}

export default PlaylistCardElement;
