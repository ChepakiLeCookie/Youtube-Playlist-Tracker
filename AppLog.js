export class AppLog {
  constructor(element) {
    this.element = element;
  }

  log(message, style, type) {
    const p = document.createElement("p");
    p.innerHTML = message;
    this.element.append(p);
    return message;
  }
}
