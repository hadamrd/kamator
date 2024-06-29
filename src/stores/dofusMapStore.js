/* eslint-disable no-unused-vars */
import {
    defineStore
} from 'pinia';
import { api } from 'boot/axios'

export const useDofusMapStore = defineStore('dofusMapStore', {
    state: () => {
        return {
            tiles: {},
            resourceMarkers: {},
            config: null,
            language: 'fr',
            textMapping: {},
            worlds: null,
            world: null,
            defaultTile: require('@/assets/dofusMap/placeholder.png'),
            tileExistence: {},
            coordsToId: {},
            resources: {}
        };
    },
    actions: {
        async getWorldsData() {
            if (this.worlds)
                await this.fetchWorldsData();
            return this.worlds;
        },
        async fetchWorldsData() {
            const response = await api.get(`/dofus-map/`);
            this.worlds = response.data.worlds;
            this.config = response.data.config;
            return response.data;
        },
        async getResourcesData() {
            if (this.resources)
                await this.fetchResourcesData();
            return this.resources;
        },
        async fetchResourcesData() {
            try {
                const response = await api.get(`/dofus-map/resources/`);
                this.resources = response.data;
                return response.data;
            } catch (error) {
                if (api.isAxiosError(error) && error.response && error.response.status === 404) {
                    console.log('Resource not found:', error.response.status);
                } else {
                    console.error('Failed to fetch resources:', error);
                }
                return null; // Return null or {} or [] based on what your application expects
            }
        },
        async getWorldDetails(worldId) {
            if (worldId == null)
                worldId = this.config.startWorldId;
            await this.fetchWorldDetails(worldId);
            return this.world;
        },
        async fetchCoordsToId(worldId) {
            try {
                const response = await api.get(`/dofus-map/${worldId}/coords-ids`);
                this.coordsToId = response.data;
                return this.coordsToId
            } catch (error) {
                console.error('Failed to fetch coords ids:', error);
                return null;
            }
        },
        async fetchWorldDetails(worldId) {
            const response = await api.get(`/dofus-map/${worldId}/`);
            this.world = response.data;
            if (this.world.startPosition != null) {
                let zoom = this.world.startPosition.zoom;
                zoom = Math.min(zoom, this.config.maxZoom);
                zoom = Math.max(this.world.minZoom, zoom);
                this.world.startPosition.zoom = zoom;
            }
            this.resourceMarkers = {};
            this.tiles = {};
            return response.data;
        },
        getTileUrl(zoom, x, y) {
            return `/dofus-map/${this.world.id}/tiles/${zoom}/${x}/${y}/`;
        },
        async getTileImage(zoom, x, y) {
            if (this.tileExistenceFromCache(zoom, x, y) != null && !this.tileExistenceFromCache(zoom, x, y))
                return this.defaultTile;
            if (this.tiles?.[zoom]?.[x]?.[y] != null) {
                return this.tiles[zoom][x][y];
            }
            return await this.fetchTileImage(zoom, x, y);
        },
        async fetchTileImage(zoom, x, y) {
            const response = await api.get(this.getTileUrl(zoom, x, y), {
                responseType: 'blob'
            });
            if (!this.tiles[zoom])
                this.tiles[zoom] = {};
            if (!this.tiles[zoom][x])
                this.tiles[zoom][x] = {};
            this.tiles[zoom][x][y] = response.data;
            return response.data;
        },
        async getResourceMarkers(ressourceId) {
            if (!this.resourceMarkers[ressourceId])
                await this.fetchResourceMarkers(ressourceId);
            return this.resourceMarkers[ressourceId];
        },
        async fetchResourceMarkers(ressourceId) {
            const response = await api.get(`/dofus-map/${this.world.id}/resource-markers/${ressourceId}/`);
            this.resourceMarkers[ressourceId] = response.data;
            return response.data;
        },
        worldName() {
            if (!this.world)
                return 'unknown';
            return this.i18n(this.world.nameId);
        },
        tileExistenceFromCache(zoom, x, y) {
            if (
                this.tileExistence?.[this.world.id]?.[zoom]?.[x]?.[y] != null
            )
                return this.tileExistence[this.world.id][zoom][x][y];
            return null;
        },
        storeTileExistence(zoom, x, y, value) {
            if (this.tileExistence == null)
                this.tileExistence = {};
            if (!this.tileExistence[this.world.id])
                this.tileExistence[this.world.id] = {};
            if (!this.tileExistence[this.world.id][zoom])
                this.tileExistence[this.world.id][zoom] = {};
            if (!this.tileExistence[this.world.id][zoom][x])
                this.tileExistence[this.world.id][zoom][x] = {};
            this.tileExistence[this.world.id][zoom][x][y] = value;
        },
        getIdTextMapping(language) {
            if (!this.textMapping || !this.textMapping[language])
                this.textMapping[language] = require(`@/assets/dofusMap/i18n/${language}.json`);
            return this.textMapping[language];
        },
        i18n(textId, ...args) {
            const textMapping = this.getIdTextMapping(this.language); // Assumes this function fetches the right localizations
            let str = textMapping[textId] || "Text not found"; // Fallback text
            let result = str.replace(/%(\d+)/g, (match, p1, offset, s) => {
                return this.i18n(args[parseInt(p1) - 1]) || "undefined";
            });
            return result;
        }

    },
});
