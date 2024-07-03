<template>
  <SessionRunList @select-session="selectSession" />
  <SessionRunDetails v-if="selectedSession" :session-id="selectedSession" />
</template>

<script>
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
    const globalStore = useGlobalStore();
    globalStore.header = "Dashboard";
    return { selectedSession: ref(null) };
  },
  methods: {
    selectSession(sessionId) {
      this.selectedSession = sessionId;
    },
  },
};
</script>
