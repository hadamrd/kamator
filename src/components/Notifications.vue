<template>
  <div>
    <q-card class="q-pa-md">
      <q-card-section>
        <q-btn
          color="negative"
          label="Clear All"
          icon="delete"
          @click="clearAllNotifications"
          class="q-mb-md"
        />
      </q-card-section>
      <q-card-section>
        <q-table :rows="notificationSummaries" :columns="columns" row-key="id">
          <template v-slot:body-cell-details="props">
            <q-td :props="props">
              <q-btn flat label="Details" @click="showDetails(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Modal for displaying notification details -->
    <q-dialog v-model="detailsDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Notification Details</div>
          <q-space />
          <q-btn icon="close" flat round @click="detailsDialog = false" />
        </q-card-section>
        <q-card-section>
          <template>
            <div>
              <pre>{{ formattedNotification }}</pre>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { useWebSocketStore } from "stores/webSockets";
import { ref } from "vue";
import { useGlobalStore } from "stores/globalVuesStore";

export default {
  name: "NotificationsCenter",
  setup() {
    const wsstore = useWebSocketStore();
    const globalStore = useGlobalStore();
    globalStore.header = "Notifications";
    const detailsDialog = ref(false);
    const selectedNotification = ref(null);
    const columns = [
      { name: "event_id", label: "ID", field: "event_id", sortable: true },
      {
        name: "character_name",
        label: "Character",
        field: "character_name",
        sortable: true,
      },
      {
        name: "earnedKamas",
        label: "Kamas Earned",
        field: "earnedKamas",
        sortable: true,
      },
      {
        name: "earnedLevels",
        label: "Levels Earned",
        field: "earnedLevels",
        sortable: true,
      },
      {
        name: "nbrFightsDone",
        label: "Fights Done",
        field: "nbrFightsDone",
        sortable: true,
      },
      { name: "details", label: "Details", field: "details", sortable: false },
    ];
    return {
      wsstore,
      detailsDialog,
      selectedNotification,
      columns,
    };
  },
  filters: {
    pretty(value) {
      return JSON.stringify(value, null, 2);
    },
  },
  computed: {
    formattedNotification() {
      return this.selectedNotification;
    },
    notificationSummaries() {
      return this.wsstore.notifications.map((notification) => ({
        event_id: notification.event_id,
        id: notification.session_run_id,
        character_name: notification.character_name,
        earnedKamas: notification.player_stats.earnedKamas,
        earnedLevels: notification.player_stats.earnedLevels,
        nbrFightsDone: notification.player_stats.nbrFightsDone,
        details: notification,
      }));
    },
  },
  methods: {
    clearAllNotifications() {
      this.wsstore.clearNotifications();
    },
    showDetails(notification) {
      this.selectedNotification = notification.details;
      this.detailsDialog = true;
    },
  },
};
</script>

<style scoped>
.float-right {
  float: right;
}
</style>
