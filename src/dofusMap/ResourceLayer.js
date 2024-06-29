/* eslint-disable no-unused-vars */
import L from 'leaflet';
import 'leaflet.markercluster';
import './styles/resourceLayer.css'
import { ResourceLegend } from './ResourceLegend';
import {
    dofusXYToMapXY,
    getScalingFactor
} from './MapTools';
import './styles/markerLayer.css'
const resourceIcons = import.meta.glob('/src/assets/dofusMap/resourceSprite/*.png');
const markersScaleAmplification = 150;
export class ResourceLayer {
    constructor(map) {
        this._map = map;
        this.markersData = {};
        this.markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            removeOutsideVisibleBounds: true,
            spiderfyOnMaxZoom: true,
            maxClusterRadius: 40,  // pixels
            spiderLegPolylineOptions: {
                opacity: 0
            }
        });
        this._map.addLayer(this.markers);
        this.resources = null;
        this.markers.on('spiderfied', function (event) {
            event.cluster.setOpacity(0.1); // Sets a transparent icon only when spiderfied
        });
        this.legend = new ResourceLegend({ position: 'topright', resources: this.resources });
        this.minMarkerIconSize = 16;
        this.minMarkerIconTextSize = 8;
        map.addControl(this.legend);
        this._map.on('zoomend', this.onZoomEnd.bind(this));

    }

    async draw(selectedResources) {
        this.resources = selectedResources;
        this.legend.draw(this.resources);
        this.clear();
        for (const resource of selectedResources) {
            try {
                const data = await this._map.store.getResourceMarkers(resource.id);
                this.populate(data, resource);
            } catch (error) {
                console.error('Error fetching markers for resource:', resource.id, error);
                // Continue looping even if one resource fails
            }
        }
    }

    async redraw() {
        this.clear();
        this.legend.draw(this.resources);
        if (this.resources) {
            for (const resource of this.resources) {
                try {
                    const data = await this._map.store.getResourceMarkers(resource.id);
                    this.populate(data, resource);
                } catch (error) {
                    console.error('Error fetching markers for resource:', resource.id, error);
                }
            }
        }
    }

    populate(markers, resource) {
        markers.forEach(marker => {
            this.initializeMarkerData(resource, marker);
        });
        this.createMarkers();
    }

    createCustomIcon(markerData) {
        return L.divIcon({
            html: `<div class="icon-wrapper">
                    <img src="${resourceIcons(`./${markerData.resource.id}.png`)}" alt="${markerData.resource.name}" />
                    <div class="icon-text-wrapper">
                        <span class="icon-text">${markerData.quantity}</span>
                    </div>
                </div>`,
            className: 'resource-icon',
            iconAnchor: [0, 0]
        });
    }


    createDetailedPopup(markerData) {
        return `<div class="custom-popup-style">
                    <strong>${markerData.resource.name}</strong>: ${markerData.quantity}
                </div>`;
    }

    createMarkers() {
        Object.keys(this.markersData).forEach(lat => {
            Object.keys(this.markersData[lat]).forEach(lng => {
                const markerInfo = this.markersData[lat][lng];
                if (markerInfo.created)
                    return
                markerInfo.resources.forEach(markerData => {
                    if (markerData.created) {
                        return;
                    }
                    var icon = this.createCustomIcon(markerData);
                    var marker = L.marker([lat, lng], { icon });
                    var detailedPopup = this.createDetailedPopup(markerData);

                    marker.bindPopup(detailedPopup, {
                        className: 'custom-popup-style',
                        closeButton: false
                    });

                    marker.on('mouseover', (e) => {
                        e.target.openPopup();
                    });
                    
                    marker.on('mouseout', function (e) {
                        e.target.closePopup();
                    });

                    this.markers.addLayer(marker);
                    markerData.created = true;
                });
            });
        });
    }

    clear() {
        this.markers.clearLayers();
        this.markersData = {};
    }

    initializeMarkerData(resource, marker) {
        // Convert x, y coordinates to lat, lng
        let latlng = dofusXYToMapXY(marker.x + 0.5, marker.y + 0.5, this._map.config);

        // Ensure there is a structure for the latitude
        if (!this.markersData[latlng.lat]) {
            this.markersData[latlng.lat] = {};
        }

        // Ensure there is a structure for the longitude under this latitude
        if (!this.markersData[latlng.lat][latlng.lng]) {
            this.markersData[latlng.lat][latlng.lng] = {
                resources: []
            };
        }

        // Attempt to find an existing resource with the same ID at this location
        let existingResource = this.markersData[latlng.lat][latlng.lng].resources.find(r => r.resource.id == resource.id);

        if (existingResource) {
            existingResource.quantity += marker.quantity;
        } else {
            this.markersData[latlng.lat][latlng.lng].resources.push({
                resource,
                quantity: marker.quantity,
                created: false
            });
        }
    }

    onZoomEnd(event) {
        const scaleFactor = getScalingFactor(this._map.getZoom(), this._map.config.maxZoom);
        this.updateIconStyles(scaleFactor);
    }

    updateIconStyles(multiplicationFactor) {
        const iconSize = Math.min(parseInt(markersScaleAmplification * multiplicationFactor + this.minMarkerIconSize), 60);
        const iconTextSize = parseInt(markersScaleAmplification * multiplicationFactor + this.minMarkerIconTextSize);
        // console.log("icon size : ", iconSize)
        document.documentElement.style.setProperty('--icon-size', `${iconSize}px`);
        document.documentElement.style.setProperty('--icon-text-size', `${iconTextSize}px`);
        if (iconSize >= 32) {
            document.documentElement.style.setProperty('--icon-text-visibility', 'block');
        } else {
            document.documentElement.style.setProperty('--icon-text-visibility', 'none');
        }
    }

}