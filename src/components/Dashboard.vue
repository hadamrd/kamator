<template>
  <SessionRunList @select-session="selectSession" />
  <SessionRunDetails v-if="selectedSession" :session-id="selectedSession" />
</template>

<script>
import { useSessionRunStore } from "src/stores/sessionRuns";
import SessionRunList from "./SessionRunList.vue";
import SessionRunDetails from "./SessionRunDetails.vue";
import { useGlobalStore } from "stores/globalVuesStore";

import { ref } from "vue";

export default {
  name: "DashboardHome",
  components: {
    SessionRunList,
    SessionRunDetails,
  },
  setup() {
    const sessionRunStore = useSessionRunStore();
    const globalStore = useGlobalStore();
    globalStore.header = "Dashboard";
    return { sessionRunStore, selectedSession: ref(null) };
  },
  async created() {
    await this.sessionRunStore.getSessionsRuns();
  },
  methods: {
    selectSession(sessionId) {
      this.selectedSession = sessionId;
    },
  },
};
</script>
