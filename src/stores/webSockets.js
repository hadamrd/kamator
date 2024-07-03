import { defineStore } from "pinia";
import { Notify } from "quasar";
import { ref } from "vue";
import sessionRunsApiInstance from "src/api/sessionRuns";

const NotifiableEvents = {
  PlayerLeveledUp: "PlayerLeveledUp",
  JobLevelUp: "JobLevelUp",
};

export const useWebSocketStore = defineStore("webSocketStore", {
  state: () => {
    return {
      ws: null,
      notifications: ref([]),
      retryCount: 0,
      maxRetries: 100,
      notify_endpoint: import.meta.env.VITE_NOTIFY_ENDPOINT,
      retryDelay: 2000,
      status_notify_type: "status_change",
      stats_notify_type: "stats_update",
      notify_timeout: 1000,
      readyState: ref(WebSocket.CLOSED),
    };
  },
  computed: {
    connecting() {
      return this.readyState === WebSocket.CONNECTING;
    },
  },
  actions: {
    getNotifyMessage(event_id, character_name) {
      switch (event_id) {
        case NotifiableEvents.PlayerLeveledUp:
          return `${character_name} has leveled up!`;
        case NotifiableEvents.JobLevelUp:
          return `${character_name} job leveled up!`;
      }
    },
    initializeWebSocket() {
      if (this.connecting) {
        console.log("WebSocket is already initializing...");
        return;
      }
      console.log("Initializing WebSocket...");
      this.readyState = WebSocket.CONNECTING;
      this.connecting = true;
      this.connectWebSocket();
    },
    connectWebSocket() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("WebSocket is already connected.");
        this.connecting = false;
        this.readyState = WebSocket.OPEN;
        return;
      }
      if (this.retryCount >= this.maxRetries) {
        console.error("Maximum WebSocket reconnection attempts reached.");
        return;
      }
      this.ws = new WebSocket(this.notify_endpoint);
      this.ws.onopen = this.handleWebSocketConnect; // Setup onopen handler
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleWebSocketClose;
      this.ws.onerror = this.handleWebSocketError;
      this.retryCount++;
    },
    handleWebSocketConnect() {
      this.readyState = WebSocket.OPEN;
      this.connecting = false;
      Notify.create({
        type: "positive",
        message: "WebSocket connection established successfully!",
        timeout: this.notify_timeout,
      });
      console.log("WebSocket connected.");
      this.resetRetryCount();
    },
    handleMessage(event) {
      let notifyData = JSON.parse(event.data);
      notifyData = JSON.parse(notifyData.message);

      if (notifyData.type === this.status_notify_type) {
        sessionRunsApiInstance.updateCacheOnUpdate(
          notifyData.session_run_id,
          { status: notifyData.new_status }
        );
      } else if (notifyData.type === this.stats_notify_type) {
        if (notifyData.event_id in NotifiableEvents) { //FIXME : this will never be matched!
          let message = "Unknown notification message.";
          if (notifyData.event_id == NotifiableEvents.PlayerLeveledUp) {
            message = `${notifyData.character_name} has leveled up!`;
          } else if (notifyData.event_id == NotifiableEvents.JobLevelUp) {
            message = `${notifyData.character_name} job leveled up!`;
          }
          Notify.create({
            type: "info",
            message: message,
            timeout: this.notify_timeout,
          });
        }
        this.notifications.push(notifyData);
        sessionRunsApiInstance.updateCacheOnUpdate(
          notifyData.session_run_id,
          notifyData.player_stats
        );
      } else {
        console.warn("Unknown notification type received:", notifyData.type);
      }
    },
    handleWebSocketClose(event) {
      this.readyState = WebSocket.CLOSED;
      console.log("WebSocket closed!", event.code, event.reason);
      console.log("Attempting to reconnect WebSocket...");
      this.connecting = false;
      setTimeout(this.connectWebSocket, this.retryDelay);
    },
    handleWebSocketError(error) {
      this.readyState = WebSocket.CLOSED;
      console.error("WebSocket Error:", error);
      Notify.create({
        type: "negative",
        message: "WebSocket encountered an error: " + error.message,
        timeout: 500,
      });
    },
    closeWebSocket() {
      if (this.ws) {
        this.ws.close(1000, "Closure initiated by client");
        this.ws = null;
        this.resetRetryCount();
      }
    },
    sendWebSocketMessage(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
      throw Error("Cant send message cause the socket is closed");
    },
    clearNotifications() {
      this.notifications = [];
    },
    resetRetryCount() {
      this.retryCount = 0;
    },
  },
});
