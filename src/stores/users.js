// src/stores/user.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useUserStore = defineStore('user', {
    actions: {
        async signup(data) {
            return await api.post('/signup/', data)
        },
        async changePassword(data) {
            return await api.post('/app_auth/change-password/', data)
        }

    }
})
