import { defineStore } from "pinia";
import { Notify } from "quasar";
import { ref } from "vue";
import sessionRunsApiInstance from "src/api/sessionRuns";

const NotifiableEvents = {
  PlayerLeveledUp: "PlayerLeveledUp",
  JobLevelUp: "JobLevelUp",
};

export const useWebSocketStore = defineStore("webSocketStore", {
  state: () => ({
    ws: null,
    notifications: [],
    retryCount: 0,
    maxRetries: 100,
    notifyEndpoint: import.meta.env.VITE_NOTIFY_ENDPOINT,
    retryDelay: 2000,
    statusNotifyType: "status_change",
    statsNotifyType: "stats_update",
    notifyTimeout: 1000,
    readyState: ref(WebSocket.CLOSED),
    statsHistory: {},
  }),
  getters: {
    isConnecting: (state) => state.readyState === WebSocket.CONNECTING,
    isOpen: (state) => state.readyState === WebSocket.OPEN,
  },
  actions: {
    getNotifyMessage(eventId, characterName) {
      switch (eventId) {
        case NotifiableEvents.PlayerLeveledUp:
          return `${characterName} has leveled up!`;
        case NotifiableEvents.JobLevelUp:
          return `${characterName} job leveled up!`;
        default:
          return "Unknown event.";
      }
    },
    initializeWebSocket() {
      if (this.isConnecting) {
        console.log("WebSocket is already initializing...");
        return;
      }
      console.log("Initializing WebSocket...");
      this.readyState = WebSocket.CONNECTING;
      this.connectWebSocket();
    },
    connectWebSocket() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("WebSocket is already connected.");
        return;
      }
      if (this.retryCount >= this.maxRetries) {
        console.error("Maximum WebSocket reconnection attempts reached.");
        return;
      }
      this.ws = new WebSocket(this.notifyEndpoint);
      this.ws.onopen = this.handleWebSocketConnect;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleWebSocketClose;
      this.ws.onerror = this.handleWebSocketError;
      this.retryCount++;
    },
    handleWebSocketConnect() {
      this.readyState = WebSocket.OPEN;
      Notify.create({
        type: "positive",
        message: "WebSocket connection established successfully!",
        timeout: this.notifyTimeout,
      });
      console.log("WebSocket connected.");
      this.resetRetryCount();
    },
    handleMessage(event) {
      const notifyData = JSON.parse(event.data);
      const message = JSON.parse(notifyData.message);

      if (message.type === this.statusNotifyType) {
        sessionRunsApiInstance.updateCacheOnUpdate(message.session_run_id, {
          status: message.new_status,
        });
      } else if (message.type === this.statsNotifyType) {
        this.updateStatsHistory(message.session_run_id, message.player_stats);
        sessionRunsApiInstance.updateCacheOnUpdate(
          message.session_run_id,
          message.player_stats
        );
        if (message.event_id in NotifiableEvents) {
          this.notifications.push(message);
          this.showNotification(message);
        }
      } else {
        console.warn("Unknown notification type received:", message.type);
      }
    },
    handleWebSocketClose(event) {
      this.readyState = WebSocket.CLOSED;
      console.log("WebSocket closed!", event.code, event.reason);
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
      } else {
        throw new Error("Can't send message because the socket is closed");
      }
    },
    clearNotifications() {
      this.notifications = [];
    },
    resetRetryCount() {
      this.retryCount = 0;
    },
    showNotification(notifyData) {
      let message = "Unknown notification message.";
      if (notifyData.event_id === NotifiableEvents.PlayerLeveledUp) {
        message = `${notifyData.character_name} has leveled up!`;
      } else if (notifyData.event_id === NotifiableEvents.JobLevelUp) {
        message = `${notifyData.character_name} job leveled up!`;
      }
      Notify.create({
        type: "info",
        message: message,
        timeout: this.notifyTimeout,
      });
    },
    updateStatsHistory(sessionRunId, playerStats) {
      if (!this.statsHistory[sessionRunId]) {
        this.statsHistory[sessionRunId] = {
          earnedKamas: [],
          nbrFightsDone: [],
          timestamps: [],
          nbrTreasuresHuntsDone: [],
          estimatedKamasWon: []
        };
      }
      const history = this.statsHistory[sessionRunId];

      // Add check to avoid pushing undefined values
      if (playerStats.earnedKamas) {
        history.timestamps.push(new Date());
        history.earnedKamas.push(playerStats.earnedKamas);
      }
      console.log('Updated history:', history);
    },
  },
});
