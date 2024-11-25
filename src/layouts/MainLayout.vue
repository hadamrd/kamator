<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="glossy" v-if="authStore.isLoggedIn">
      <q-toolbar class="grinder-title-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title class="grinder-title-toolbar-title">
          {{ globalStore.header }}
        </q-toolbar-title>

        <!-- User Menu -->
        <q-btn flat round icon="account_circle" size="md" @click="toggleUserMenu">
          <q-menu v-model="showUserMenu">
            <q-list>
              <q-item clickable @click="goToProfile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-item clickable @click="goToSettings">
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" v-if="authStore.isLoggedIn" show-if-above bordered>
      <q-scroll-area style="height: calc(100% - 150px); margin-top: 150px">
        <q-list padding>
          <q-item-label header>Essential Links</q-item-label>

          <q-item clickable tag="a" :to="{ name: 'DashboardHome' }">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
              <q-item-label caption>Monitor running bots</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable tag="a" :to="{ name: 'SessionsHome' }">
            <q-item-section avatar>
              <q-icon name="supervised_user_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Sessions</q-item-label>
              <q-item-label caption>Compose a session</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable tag="a" :to="{ name: 'PathsHome' }">
            <q-item-section avatar>
              <q-icon name="timeline" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Paths</q-item-label>
              <q-item-label caption>Manage your bots paths</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable tag="a" :to="{ name: 'AccountsHome' }">
            <q-item-section avatar>
              <q-icon name="manage_accounts" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Accounts</q-item-label>
              <q-item-label caption>Manage you bot accounts and characters</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable tag="a" :to="{ name: 'NotificationsCenter' }">
            <q-item-section avatar>
              <q-icon name="notifications" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Notifications</q-item-label>
              <q-item-label caption>Notifications about you characters state</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable tag="a" :to="{ name: 'DofusMap' }">
            <q-item-section avatar>
              <q-icon name="map" />
            </q-item-section>
            <q-item-section>
              <q-item-label>DofusMap</q-item-label>
              <q-item-label caption>Interactive dofus world Map</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-img class="absolute-top" src="https://cdn.quasar.dev/img/material.png" style="height: 150px">
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm">
            <img :src="userAvatar">
          </q-avatar>
          <div class="text-weight-bold">{{ authStore.user?.username }}</div>
        </div>
      </q-img>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <taskbar v-if="authStore.isLoggedIn" />
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/useAuthStore'
import { useGlobalStore } from 'src/stores/globalVuesStore'
import { useWebSocketStore } from 'src/stores/webSocketStore'
import Taskbar from 'components/Taskbar.vue'

export default {
  name: 'MainLayout',

  components: {
    Taskbar
  },

  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const globalStore = useGlobalStore()
    const wsstore = useWebSocketStore()

    const leftDrawerOpen = ref(false)
    const showUserMenu = ref(false)

    // Placeholder avatar - replace with actual user avatar logic
    const userAvatar = ref('https://cdn.quasar.dev/img/boy-avatar.png')

    return {
      leftDrawerOpen,
      showUserMenu,
      authStore,
      globalStore,
      wsstore,
      router,
      userAvatar
    }
  },

  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },

    goToProfile() {
      this.router.push('/profile')
      this.showUserMenu = false
    },

    goToSettings() {
      this.router.push('/settings')
      this.showUserMenu = false
    },

    async logout() {
      await this.authStore.logout()
      this.showUserMenu = false
      this.router.push('/login')
    }
  },

  async created() {
    if (this.authStore.isLoggedIn) {
      this.wsstore.initializeStore()
    }
  },

  unmounted() {
    if (this.authStore.isLoggedIn) {
      this.wsstore.disconnect()
    }
  }
}
</script>

<style scoped>
.grinder-title-toolbar {
  height: 35px;
  min-height: 20px;
  padding: 10px;
}

.grinder-title-toolbar-title {
  font-size: 16px;
}
</style>
