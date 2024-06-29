import L from 'leaflet';



export function dofusXYToMapXY(dofusX, dofusY, config) {
    let scalingFactor = getScalingFactor(0, config.maxZoom);
    let lng = dofusX * (config.mapImgWidth * scalingFactor);
    let lat = -dofusY * (config.mapImgHeight * scalingFactor);
    return L.latLng(lat, lng);
}

export function mapXYToDofusXY(latlng, config) {
    let scalingFactor = getScalingFactor(0, config.maxZoom);
    let x = latlng.lng / (config.mapImgWidth * scalingFactor);
    let y = -latlng.lat / (config.mapImgHeight * scalingFactor);
    return { x, y };
}

export function getRectangleOnMapSize(zoom, config) {
    const {
        imgWidth,
        imgHeight
    } = getScaledMapDimensions(zoom, config);
    return [
        imgWidth,
        imgHeight
    ];
}

export function getScalingFactor(zoom, maxZoom) {
    return Math.pow(2, zoom - maxZoom);
}

export function getTileOffset(tileCoordinate, config) {
    return tileCoordinate * config.tileSize;
}

export function getScaledMapDimensions(zoom, config) {
    const scalingFactor = getScalingFactor(zoom, config.maxZoom);
    return {
        imgWidth: config.mapImgWidth * scalingFactor,
        imgHeight: config.mapImgHeight * scalingFactor,
        sideOverlay: config.mapOverlaySide * scalingFactor,
        bottomOverlay: config.mapOverlayBottom * scalingFactor
    };
}

export function getDimensionBoundaries(tileOffset, overlay, dimension, config) {
    return {
        min: Math.ceil((tileOffset - overlay - dimension) / dimension),
        max: Math.floor((tileOffset + config.tileSize + overlay) / dimension)
    };
}

export function getTileBoundaries(zoom, x, y, config) {
    const {
        imgWidth,
        imgHeight,
        sideOverlay,
        bottomOverlay
    } = getScaledMapDimensions(zoom, config);
    const tileOffsetX = getTileOffset(x, config);
    const tileOffsetY = getTileOffset(y, config);
    const xBoundaries = getDimensionBoundaries(tileOffsetX, sideOverlay, imgWidth, config);
    const yBoundaries = getDimensionBoundaries(tileOffsetY, bottomOverlay, imgHeight, config);
    return {
        xBoundaries,
        yBoundaries
    };
}

export function getDofusMapCoordinates(latlng, config) {
    let {
        x,
        y
    } = mapXYToDofusXY(latlng, config);
    x = Math.floor(x);
    y = Math.floor(y);
    return {
        x,
        y
    };
}