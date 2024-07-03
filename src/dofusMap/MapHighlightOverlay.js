/* eslint-disable no-unused-vars */
import { CanvasLayer } from "leaflet-canvas-layer";
import { dofusXYToMapXY, getRectangleOnMapSize } from "./MapTools";

export class MapHighlightOverlay extends CanvasLayer {
  constructor(map, options = {}) {
    super(options);
    this._map = map;
    this.mapCoordIds = {};
    this.addTo(map);
  }

  onAdd(map) {
    super.onAdd(map);
    this.loadDataAndDraw();
  }

  onRemove(map) {
    super.onRemove(map);
  }

  onDrawLayer(info) {
    const ctx = info.canvas.getContext("2d");
    ctx.clearRect(0, 0, info.canvas.width, info.canvas.height); // clear the canvas
    Object.entries(this.mapCoordIds).forEach(([mapId, coords]) => {
      const { x, y } = coords;
      const latLng = dofusXYToMapXY(x, y, this._map.config);
      const canvasPoint = this._map.latLngToContainerPoint(latLng); // Convert latLng to canvas point
      const [width, height] = getRectangleOnMapSize(
        this._map.getZoom(),
        this._map.config
      );

      // Drawing each rectangle based on the canvas pixel coordinates
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Set your desired color and opacity
      ctx.fillRect(canvasPoint.x, canvasPoint.y, width, height);
    });
  }

  loadDataAndDraw() {
    this._map.store
      .fetchCoordsToId(this._map.store.world.id)
      .then((mapCoordIds) => {
        if (mapCoordIds === null) {
          return;
        }
        this.mapCoordIds = mapCoordIds;
        this.needRedraw();
      });
  }
}
