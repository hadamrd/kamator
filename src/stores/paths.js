import {
    defineStore
} from 'pinia';
import { api } from 'boot/axios';

export const usePathStore = defineStore('paths', {
    state: () => ({
        paths: null,
        pathsTypeChoices: null,
    }),
    getters: {
        getPathsById: (state) => (id) => {
            return state.paths.find((path) => path.id === id);
        }
    },
    actions: {
        async fetchPathsTypeChoices() {
            try {
                const response = await api.get('/paths/type_choices/');
                this.pathsTypeChoices = response.data;
            } catch (error) {
                console.error('There was an error fetching the paths type choices:', error);
            }
        },
        async getPathsTypeChoices() {
            if (!this.pathsTypeChoices)
                await this.fetchPathsTypeChoices();
            return this.pathsTypeChoices;
        },
        async fetchPaths() {
            try {
                const response = await api.get('/paths/');
                this.paths = response.data;
            } catch (error) {
                console.error('There was an error fetching the paths:', error);
            }
        },
        async getPaths() {
            if (!this.paths)
                await this.fetchPaths();
            return this.paths;
        },
        async addPath(pathData) {
            try {
                const response = await api.post('/paths/', pathData);
                this.paths.push(response.data);
            } catch (error) {
                console.error('There was an error adding the path:', error);
            }
        },
        async updatePath(id, pathData) {
            try {
                await api.put(`/paths/${id}/`, pathData);
                const index = this.paths.findIndex((path) => path.id === id);
                if (index !== -1) {
                    this.paths[index] = {
                        ...this.paths[index],
                        ...pathData
                    };
                }
            } catch (error) {
                console.error('There was an error updating the path:', error);
            }
        },
        async deletePath(id) {
            try {
                await api.delete(`/paths/${id}/`);
                const index = this.paths.findIndex((path) => path.id === id);
                if (index !== -1) {
                    this.paths.splice(index, 1);
                }
            } catch (error) {
                console.error('There was an error deleting the path:', error);
            }
        }
    },
});
