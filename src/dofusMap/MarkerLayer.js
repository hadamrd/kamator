/* eslint-disable no-unused-vars */
import { dofusXYToMapXY, getScalingFactor } from "./MapTools";
import L from "leaflet";
import "./styles/markerLayer.css";

export const TYPE_ICON = {
  type1: "goDown.svg",
  type2: "goUp.svg",
  type3: "secret.svg",
  type4: "teleport.svg",
  type5: "temple.svg",
};

export class MarkerLayer {
  constructor(map) {
    this.map = map;
    this.markers = [];
    this.markersScaleAmplification = 79;
    this.minSize = 14;
    this.markerOver = null;
    this.onZoomEnd = this.onZoomEnd.bind(this);
    this.map.on("zoomend", this.onZoomEnd);
    this.draw();
  }

  getMarkerSize() {
    const scaleFactor = getScalingFactor(
      this.map.getZoom(),
      this.map.config.maxZoom
    );
    return [
      parseInt(this.markersScaleAmplification * scaleFactor) + this.minSize,
      parseInt(this.markersScaleAmplification * scaleFactor) + this.minSize,
    ];
  }

  getStaticMarkerIcon(markerType) {
    const iconHTML = `<div class="dofusMap-marker">
                            <img src="${require("@/assets/dofusMap/markerIcons/" +
                              TYPE_ICON[markerType])}" alt="Marker">
                        </div>`;
    return L.divIcon({
      className: "marker",
      html: iconHTML,
      iconSize: this.getMarkerSize(),
    });
  }

  get markersData() {
    return this.map.world.markers;
  }

  get i18n() {
    return this.map.store.i18n;
  }

  clear() {
    this.markers.forEach((marker) => {
      marker.remove();
    });
    this.markers = [];
  }

  redraw() {
    this.clear();
    this.draw();
  }

  onZoomEnd(event) {
    const scaleFactor = getScalingFactor(
      this.map.getZoom(),
      this.map.config.maxZoom
    );
    this.updateMarkersSizes(scaleFactor);
  }

  draw() {
    if (this.markersData) {
      Object.entries(this.markersData).forEach(([key, markersData]) => {
        markersData.forEach((data) => {
          const titleText = this.i18n(data.titleId, data.titleParams);

          var marker = L.marker(
            dofusXYToMapXY(data.x, data.y, this.map.config),
            {
              icon: this.getStaticMarkerIcon(key),
            }
          );

          marker.addTo(this.map);

          marker.bindPopup(titleText, {
            className: "custom-popup-style",
            closeButton: false,
          });

          marker.on("mouseover", (e) => {
            e.target.openPopup();
          });

          marker.on("mouseout", function (e) {
            e.target.closePopup();
          });

          marker.on("click", async () => {
            await this.map.updateWorld(data.worldId, {
              x: data.toX,
              y: data.toY,
              zoom: data.zoom,
            });
          });

          this.markers.push(marker);
        });
      });
    }
  }

  updateMarkersSizes(scaleFactor) {
    const newSize = [
      parseInt(this.markersScaleAmplification * scaleFactor) + this.minSize,
      parseInt(this.markersScaleAmplification * scaleFactor) + this.minSize,
    ];

    this.markers.forEach((marker) => {
      marker.options.icon.options.iconSize = newSize;
      marker.setIcon(
        L.divIcon({
          className: marker.options.icon.options.className,
          html: marker.options.icon.options.html,
          iconSize: newSize,
        })
      );
    });
  }
}
