/* eslint-disable no-unused-vars */
import L from 'leaflet';
import {
    dofusXYToMapXY,
    getDofusMapCoordinates,
    getRectangleOnMapSize,
} from './MapTools';
import './styles/mapBorderHighlighter.css'

export class MapBorderHighlighter {

    constructor(map) {
        this.mapHighlight = new L.Marker(
            dofusXYToMapXY(0, 0, map.config), 
            {
                interactive: false,
                icon: L.divIcon({
                    className: 'map-border-highlight',
                    html: '<div></div>',
                    iconAnchor: [0, 0],
                    iconSize: getRectangleOnMapSize(0, map.config)
                }),
            }
        );
        this.selectedDofusMapsMarkers = [];
        this.selectedMaps = [];
        this._map = map;
        this._map.on('mousemove', this.mouseMoveOnMap.bind(this));
        this._map.on('zoomend', this.updateSize.bind(this));
        this._map.on('mousedown', this.ctrlClickOnMap.bind(this))
        this.dofusCoords = {
            x: 0,
            y: 0
        }
        this.mapHighlight.addTo(this._map);
        this.pathCreatorMode = false;
        this.showKnownMapIds = true;
        this.knownMapIdsMarkers = {}
    }

    setPathCreatorMode(value) {
        this.pathCreatorMode = value;
        if (!value) {
            this.clearAllSelectedMaps();
        }
    }
    
    ctrlClickOnMap(event) {
        if (!this.pathCreatorMode) {
            return;
        }
        if (event.originalEvent.ctrlKey) { // Check if the Ctrl key was pressed during the click
            const coordKey = this.getCoordsKey(this.dofusCoords);
            if (!this.selectedDofusMapsMarkers[coordKey]) {
                let marker = this.createSelectedMapMarker(this.dofusCoords.x, this.dofusCoords.y);
                this.selectedDofusMapsMarkers[coordKey] = marker;
                marker.addTo(this._map);
                this._map.fire('ctrlclick', {
                    dofusCoords: this.dofusCoords,
                    latlng: event.latlng // Pass the original LatLng from the event
                });
            } else {
                this.selectedDofusMapsMarkers[coordKey].remove();
                delete this.selectedDofusMapsMarkers[coordKey];
            }
        }
    }

    getKnownMapIdMarkerIcon(x, y, mapId) {
        const size = getRectangleOnMapSize(this._map.getZoom(), this._map.config);
        // const shouldDisplayCoords = this._map.getZoom() >= 3;
        return new L.divIcon({
            className: 'map-border-selected',
            html: `<div class="icon-container known-maps">
                    ${this.showKnownMapIds ? `<div class="coordinates-label"></div>` : ''}
                </div>`,
            iconAnchor: [0, 0],
            iconSize: size
        })
    }

    getSelectedMapMarkerIcon(x, y) {
        const size = getRectangleOnMapSize(this._map.getZoom(), this._map.config);
        const shouldDisplayCoords = this._map.getZoom() >= 3;
        return new L.divIcon({
            className: 'map-border-selected',
            html: `<div class="icon-container">
                    ${shouldDisplayCoords ? `<div class="coordinates-label">${x}, ${y}</div>` : ''}
                </div>`,
            iconAnchor: [0, 0],
            iconSize: size
        })
    }

    mouseMoveOnMap(event) {
        this.dofusCoords = getDofusMapCoordinates(event.latlng, this._map.config);
        this.mapHighlight.setLatLng(dofusXYToMapXY(this.dofusCoords.x, this.dofusCoords.y, this._map.config));
    }

    updateMarkerSize(marker, newIconSize, className) {
        marker.options.icon.options.iconSize = newIconSize;
        marker.options.icon.options.className = className;
        marker.setIcon(marker.options.icon);
    }

    updateSize(event) {
        const newIconSize = getRectangleOnMapSize(this._map.getZoom(), this._map.config);
        this.updateMarkerSize(this.mapHighlight, newIconSize, 'map-border-highlight');
        Object.entries(this.selectedDofusMapsMarkers).forEach(([key, marker]) => {
            const { x, y } = this.getCoordsFromKey(key);
            marker.setIcon(this.getSelectedMapMarkerIcon(x, y))
        });
    }

    createSelectedMapMarker(x, y) {
        const position = dofusXYToMapXY(x, y, this._map.config);
        return new L.Marker(
            position, 
            {
                interactive: false,
                icon: this.getSelectedMapMarkerIcon(x, y),
            }
        )
    }

    getDofusMapIdFromCoords(coords) {
        return 666;
    }

    getCoordsFromKey(key) {
        if (key == null) {
            throw new Error("Got null map key");
        }
        const parts = key.split('*');
        if (parts.length === 2) {
            return {
                x: parseInt(parts[0], 10),  // Convert x part to an integer
                y: parseInt(parts[1], 10)   // Convert y part to an integer
            };
        } else {
            throw new Error("Invalid key format. Key must be in the format 'x*y'." + `got ${key} instead.`);
        }
    }

    getCoordsKey(coords) {
        return `${coords.x}*${coords.y}`
    }

    removeMarkerByCoords(x, y) {
        const key = this.getCoordsKey({x, y});
        if (this.selectedDofusMapsMarkers[key]) {
            this.selectedDofusMapsMarkers[key].remove();
            delete this.selectedDofusMapsMarkers[key];
        }
    }

    clearAllSelectedMaps() {
        // Remove all selected markers
        Object.values(this.selectedDofusMapsMarkers).forEach(marker => {
            marker.remove();
        });
        this.selectedDofusMapsMarkers = {}; // Reset the marker storage
    }

    clearKnownMapsHighlight() {
        // Remove all selected markers
        Object.values(this.knownMapIdsMarkers).forEach(marker => {
            marker.remove();
        });
        this.knownMapIdsMarkers = {}; // Reset the marker storage
    }

    remove() {
        // Remove the highlight marker
        if (this.mapHighlight) {
            this.mapHighlight.remove();
        }
        this.clearAllSelectedMaps();
    }
}