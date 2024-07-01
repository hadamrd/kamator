/* eslint-disable no-unused-vars */
// mapLogic.js
import L from "leaflet";
import "leaflet-canvas-layer";
import { DofusMapTileLayer } from "./TileLayers";
import { dofusXYToMapXY } from "./MapTools";
import "leaflet/dist/leaflet.css";
import { MarkerLayer } from "./MarkerLayer";
import { MapBorderHighlighter } from "./MapBorderHighlighter";
import { MouseTooltip } from "./MouseTooltip";
import { ResourceLayer } from "./ResourceLayer";
import { MapHighlightOverlay } from "./MapHighlightOverlay";

export class DofusWorldMap extends L.Map {
  constructor(id, store, amplificationFactor = 1) {
    const { x, y, zoom } = DofusWorldMap.getStartPosition(store.world);
    const center = dofusXYToMapXY(x, y, store.config);
    store.config.tileSize *= amplificationFactor;
    store.config.mapImgWidth *= amplificationFactor;
    store.config.mapImgHeight *= amplificationFactor;
    store.config.mapOverlaySide *= amplificationFactor;
    store.config.mapOverlayBottom *= amplificationFactor;
    super(id, {
      crs: L.CRS.Simple,
      maxZoom: store.config.maxZoom,
      minZoom: store.world.minZoom,
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });
    this.amplificationFactor = amplificationFactor;
    this.store = store;
    this.dofusMapX = x;
    this.dofusMapY = y;
    this.tileLayer = new DofusMapTileLayer(this, {
      tileSize: store.config.tileSize,
    });
    this.mapBordersHighlighter = new MapBorderHighlighter(this);
    this.mouseTooltip = new MouseTooltip({ position: "bottomleft" });
    this.addControl(this.mouseTooltip);
    this.markerLayer = new MarkerLayer(this);
    this.resourceLayer = new ResourceLayer(this);
    this.highlightOverlay = new MapHighlightOverlay(this);
    this.setView(center, zoom);
  }

  async updateWorld(worldId, startPosition = null) {
    await this.store.fetchWorldDetails(worldId);
    if (startPosition != null) this.world.startPosition = startPosition;
    const { x, y, zoom } = DofusWorldMap.getStartPosition(this.world);
    let center = dofusXYToMapXY(x, y, this.config);
    this.setView(center, zoom, {
      animation: true,
      loadStrategy: {
        preloadAdjacent: true,
      },
    });
    this.setMinZoom(this.world.minZoom);
    this.tileLayer.redraw();
    this.markerLayer.redraw();
    this.resourceLayer.redraw();
    this.fire("worldChanged", { world: this.world });
  }

  async setResourcesMarkers(resources) {
    await this.resourceLayer.draw(resources);
  }

  static getStartPosition(world) {
    let x, y, zoom;
    if (world.startPosition) {
      x = world.startPosition.x;
      y = world.startPosition.y;
      zoom = world.startPosition.zoom;
    } else {
      x = 0.5;
      y = 0.5;
      zoom = this.config.maxZoom;
    }
    return {
      x,
      y,
      zoom,
    };
  }

  get worldName() {
    return this.store.worldName();
  }

  get world() {
    return this.store.world;
  }

  get config() {
    return this.store.config;
  }
}
