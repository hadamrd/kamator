/* eslint-disable no-unused-vars */
// mapLogic.js
import L from "leaflet";
import {
  getScalingFactor,
  getTileBoundaries as getTileBoundaries,
} from "./MapTools";

export class DofusMapTileLayer extends L.TileLayer {
  constructor(map, options = {}) {
    super("", options);
    this.map = map;
    this.addTo(map);
  }

  get store() {
    return this.map.store;
  }

  get config() {
    return this.store.config;
  }

  get world() {
    return this.store.world;
  }

  get mapsRanges() {
    return this.world.mapsRanges;
  }

  get maxZoom() {
    return this.config.maxZoom;
  }

  get minZoom() {
    return this.world.minZoom;
  }

  createTile(coords, done) {
    const { x, y, z } = coords;
    const tile = document.createElement("img");

    if (!this.doesTileExist(z, x, y)) {
      tile.src = this.store.defaultTile;
      done(null, tile);
      return tile;
    }

    this.store
      .getTileImage(z, x, y)
      .then((tileData) => {
        if (tileData && tileData instanceof Blob) {
          tile.src = URL.createObjectURL(tileData);
          tile.onload = () => done(null, tile);
          tile.onerror = () => {
            this.store.storeTileExistence(z, x, y, false);
            URL.revokeObjectURL(tile.src);
            tile.src = this.store.defaultTile;
            done(null, tile);
          };
        } else {
          throw new Error("Tile data is not a blob");
        }
      })
      .catch((error) => {
        console.error("Failed to load tile:", error);
        this.store.storeTileExistence(z, x, y, false);
        done(error, tile);
        tile.src = this.store.defaultTile;
      });
    return tile;
  }

  getWorldDims(zoom, dims) {
    let scalingFactor = getScalingFactor(zoom, dims.maxZoom);
    return {
      minX: Math.floor(dims.tileMinX * scalingFactor),
      maxX: Math.floor(dims.tileMaxX * scalingFactor),
      minY: Math.floor(dims.tileMinY * scalingFactor),
      maxY: Math.floor(dims.tileMaxY * scalingFactor),
    };
  }

  isInRange(x, y) {
    if (!(String(x) in this.mapsRanges)) {
      return false;
    }
    return this.mapsRanges[x].some(
      (range) => y >= range.y_min && y <= range.y_max
    );
  }

  doesTileExist(zoom, x, y) {
    let tileExistence = this.store.tileExistenceFromCache(zoom, x, y);
    if (tileExistence != null) return tileExistence;
    if (this.world.hasWorldMap && zoom <= this.world.dimensions.maxZoom) {
      const { minX, maxX, minY, maxY } = this.getWorldDims(
        zoom,
        this.world.dimensions
      );
      tileExistence = x >= minX && x <= maxX && y >= minY && y <= maxY;
      this.store.storeTileExistence(zoom, x, y, tileExistence);
      return tileExistence;
    } else {
      const { xBoundaries, yBoundaries } = getTileBoundaries(
        zoom,
        x,
        y,
        this.config
      );
      for (let mapX = xBoundaries.min; mapX <= xBoundaries.max; mapX++) {
        for (let mapY = yBoundaries.min; mapY <= yBoundaries.max; mapY++) {
          if (this.isInRange(mapX, mapY)) {
            this.store.storeTileExistence(zoom, x, y, true);
            return true;
          }
        }
      }
      this.store.storeTileExistence(zoom, x, y, false);
      return false;
    }
  }
}
