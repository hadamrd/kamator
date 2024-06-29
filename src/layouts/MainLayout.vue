<template>
  <q-layout view="lHh Lpr lFf">
      <q-header elevated class="glossy" v-show="showHeader">
          <q-toolbar class="grinder-title-toolbar" shrink>
              <q-toolbar-title class="grinder-title-toolbar-title">
                  {{ globalStore.header }}
              </q-toolbar-title>
              <q-btn flat dense round @click="leftDrawerOpen = !leftDrawerOpen" aria-label="Menu" icon="menu" />
          </q-toolbar>
      </q-header>

      <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
          <q-scroll-area style="height: calc(100% - 150px); margin-top: 150px;">
              <q-list padding>
                  <q-item-label header>Essential Links</q-item-label>
                  <q-item clickable tag="a" :to="{ 'name': 'DashboardHome' }">
                      <q-item-section avatar>
                          <q-icon name="dashboard" />
                      </q-item-section>
                      <q-item-section>
                          <q-item-label>Dashboard</q-item-label>
                          <q-item-label caption>Monitor running bots</q-item-label>
                      </q-item-section>
                  </q-item>
                  <q-item clickable tag="a" :to="{ 'name': 'SessionsHome' }">
                      <q-item-section avatar>
                          <q-icon name="supervised_user_circle" />
                      </q-item-section>
                      <q-item-section>
                          <q-item-label>Sessions</q-item-label>
                          <q-item-label caption>Compose a session</q-item-label>
                      </q-item-section>
                  </q-item>
                  <q-item clickable tag="a" :to="{ 'name': 'PathsHome' }">
                      <q-item-section avatar>
                          <q-icon name="timeline" />
                      </q-item-section>
                      <q-item-section>
                          <q-item-label>Paths</q-item-label>
                          <q-item-label caption>Manage your bots paths</q-item-label>
                      </q-item-section>
                  </q-item>
                  <q-item clickable tag="a" :to="{ 'name': 'AccountsHome' }">
                      <q-item-section avatar>
                          <q-icon name="manage_accounts" />
                      </q-item-section>
                      <q-item-section>
                          <q-item-label>Accounts</q-item-label>
                          <q-item-label caption>Manage you bot accounts and characters.</q-item-label>
                      </q-item-section>
                  </q-item>
                  <q-item clickable tag="a" :to="{ 'name': 'NotificationsCenter' }">
                      <q-item-section avatar>
                          <q-icon name="notifications" />
                      </q-item-section>
                      <q-item-section>
                          <q-item-label>Notifications</q-item-label>
                          <q-item-label caption>Notifications about you characters state</q-item-label>
                      </q-item-section>
                  </q-item>
                  <q-item clickable tag="a" :to="{ 'name': 'DofusMap' }">
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
                      <img src="https://cdn.quasar.dev/img/boy-avatar.png">
                  </q-avatar>
                  <div class="text-weight-bold">Some User</div>
                  <div>@UserNickname</div>
              </div>
          </q-img>
      </q-drawer>

      <q-page-container>
          <router-view />
      </q-page-container>

      <taskbar />
  </q-layout>

</template>

<script>
import { ref } from 'vue'
import { useWebSocketStore } from 'src/stores/webSockets';
import { useSessionRunStore } from 'src/stores/sessionRuns';
import { useGlobalStore } from 'src/stores/globalVuesStore';
import Taskbar from 'components/Taskbar.vue';

export default {
  name: 'LayoutDefault',
  components: {
      Taskbar
  },
  setup() {
      const wsstore = useWebSocketStore();
      const sessionRunStore = useSessionRunStore();
      const globalStore = useGlobalStore();
      wsstore.initializeWebSocket();

      return {
          wsstore,
          sessionRunStore,
          leftDrawerOpen: ref(true),
          showHeader: ref(true),
          globalStore
      }
  },
  async created() {
      this.sessionRunStore.getSessionsRuns();
      this.wsstore.initializeWebSocket();
  },
  unmounted() {
      this.wsstore.closeWebSocket();
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
