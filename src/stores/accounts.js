import {
    defineStore
} from 'pinia';
import { api } from 'boot/axios'

export const useAccountStore = defineStore('accounts', {
    state: () => ({
        accounts: null,
        characters: null,
    }),
    getters:{
        getAccountCharacters: (state) => (accountId) => {
            if (state.characters == null)
                return [];
            return state.characters.filter(character => {
                return character.account === accountId;
            });
        },
        getAllServerNames: (state) => {
            return () => {
                let servers = new Set();
                for (const account in state.accounts) {
                    for (const character of account.characters) {
                        servers.add(character.serverName);
                    }
                }
                return Array.from(servers);
            };
        },
    },
    actions: {
        async getCharacters() {
            if (this.characters == null)
                await this.fetchCharacters();
            return this.characters;
        },
        getCharacter(characterId) {
            return this.characters.find(character => character.id === characterId);
        },
        async fetchCharacters() {
            try {
                const response = await api.get('/characters');
                this.characters = response.data;
                return response.data;
            } catch (error) {
                console.error('Failed to fetch characters:', error);
            }
        },
        async getAccounts() {
            if (this.accounts == null)
                await this.fetchAccounts();
            return this.accounts;
        },
        async fetchAccounts() {
            try {
                const response = await api.get('/accounts');
                this.accounts = response.data;
                return response.data;
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        },
        async fetchAccountsFromLauncher() {
            try {
                const response = await api.get('/fetch-accounts');
                this.accounts = response.data.accounts;
                this.characters = response.data.characters;
                return response.data;
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        }
    },
});
