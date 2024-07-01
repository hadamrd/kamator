/* eslint-disable no-unused-vars */
import L from "leaflet";
import { getDofusMapCoordinates } from "./MapTools";
import "./styles/MouseTooltipControl.css";

export class MouseTooltip extends L.Control {
  constructor(options = {}) {
    super(options);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  onAdd(map) {
    this._map = map;
    this._container = L.DomUtil.create("div", "mouse-tooltip");
    this._container.style.display = "none";

    map.on("mousemove", this.onMouseMove);
    map.on("mouseout", this.onMouseOut);

    return this._container;
  }

  onRemove(map) {
    map.off("mousemove", this.onMouseMove);
    map.off("mouseout", this.onMouseOut);
  }

  onMouseMove(event) {
    const { x, y } = getDofusMapCoordinates(event.latlng, this._map.config);
    let tooltipContent = `In Game Coords: (${x}, ${y})`;
    if (this.infoText) {
      tooltipContent += `<br/><span>${this.infoText}</span>`;
    }
    this._container.innerHTML = tooltipContent;
    this._container.style.display = "block";
  }

  onMouseOut() {
    this._container.style.display = "none";
  }

  setInfo(infoText) {
    this.infoText = infoText;
  }
}
