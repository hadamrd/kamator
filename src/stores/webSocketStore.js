import { defineStore } from "pinia";
import { Notify } from "quasar";
import { ref, markRaw } from "vue";
import sessionRunsApiInstance from "src/api/sessionRuns";
import { useAuthStore } from 'src/stores/useAuthStore'

// Constants for consistent usage
const STORAGE_KEY = 'websocket_stats_history';
const MAX_HISTORY_AGE_HOURS = 24;
const RETRY_DELAY = 2000;
const NOTIFY_TIMEOUT = 1000;
const MAX_RETRIES = 100;

const EVENTS = {
  PLAYER_LEVEL_UP: "PlayerLeveledUp",
  JOB_LEVEL_UP: "JobLevelUp"
};

const NOTIFY_TYPES = {
  STATUS: "status_change",
  STATS: "stats_update",
  ERROR: "error"
};

// Storage utilities
const storage = {
  save(data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save stats history:', error);
      return false;
    }
  },

  load() {
    try {
      const serializedData = localStorage.getItem(STORAGE_KEY);

      if (!serializedData) {
        console.log('No data found in localStorage');
        return {};
      }

      const parsedData = JSON.parse(serializedData);
      return parsedData;
    } catch (error) {
      console.error('Failed to load stats history:', error);
      return {};
    }
  },

  removeOldData(data) {
    const cutoffTime = Date.now() - (MAX_HISTORY_AGE_HOURS * 60 * 60 * 1000);
    const cleaned = {};

    Object.entries(data).forEach(([sessionId, sessionData]) => {
      if (sessionData?.timestamps?.length > 0) {
        const lastTimestamp = new Date(sessionData.timestamps[sessionData.timestamps.length - 1]).getTime();
        if (lastTimestamp > cutoffTime) {
          cleaned[sessionId] = sessionData;
        }
      }
    });

    return cleaned;
  }
};

export const useWebSocketStore = defineStore("webSocketStore", {
  state: () => {
    let initialState = {
      _socket: null,
      readyState: ref(WebSocket.CLOSED),
      statsHistory: ref({}),
      notifications: [],
      retryCount: 0,
      notifyEndpoint: import.meta.env.VITE_NOTIFY_ENDPOINT,
      _isDisconnecting: false
    };

    try {
      const savedData = storage.load();
      const cleanedData = storage.removeOldData(savedData);
      initialState.statsHistory = ref(cleanedData);
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }

    return initialState;
  },

  getters: {
    isConnecting: (state) => state.readyState === WebSocket.CONNECTING,
    isConnected: (state) => state.readyState === WebSocket.OPEN,
    getSessionStats: (state) => (sessionId) => {
      const stats = state.statsHistory[sessionId];
      if (!stats) {
        return {
          earnedKamas: [],
          estimatedKamasWon: [],
          timestamps: [],
          nbrFightsDone: [],
          nbrTreasuresHuntsDone: []
        };
      }
      return stats;
    }
  },

  actions: {
    initializeStore() {
      console.log('InitializeStore called');

      this.initializeWebSocket();

      // Set up periodic cleanup
      setInterval(() => {
        this.cleanupOldData();
      }, 60 * 60 * 1000);
    },

    initializeWebSocket() {
      if (this.isConnecting || this._socket?.readyState === WebSocket.OPEN) {
        return;
      }

      this.readyState = WebSocket.CONNECTING;

      try {
        this._socket = markRaw(new WebSocket(this.notifyEndpoint + `?token=${useAuthStore().token}`));
        this.setupSocketHandlers();
      } catch (error) {
        console.error('WebSocket initialization failed:', error);
        this.handleConnectionError();
      }
    },

    setupSocketHandlers() {
      if (!this._socket) return;

      this._socket.onopen = () => {
        this.readyState = WebSocket.OPEN;
        this.retryCount = 0;
      };

      this._socket.onmessage = this.handleWebSocketMessage;
      this._socket.onclose = this.handleWebSocketClose;
      this._socket.onerror = this.handleWebSocketError;
    },

    handleWebSocketMessage(event) {
      if (this._isDisconnecting) return;

      try {
        const wrapper = JSON.parse(event.data);

        if (wrapper.type == 'error') {
          console.log(`Received websocket error from server: ${wrapper.message}`)
          this.disconnect()
          return
        }

        const message = JSON.parse(wrapper.message);

        switch (message.type) {
          case NOTIFY_TYPES.STATUS:
            this.handleStatusUpdate(message);
            break;
          case NOTIFY_TYPES.STATS:
            this.handleStatsUpdate(message);
            break;
        }
      } catch (error) {
        console.error('Message handling failed:', error);
      }
    },

    handleStatusUpdate(message) {
      sessionRunsApiInstance.updateCacheOnUpdate(
        message.session_run_id,
        { status: message.new_status }
      );
    },

    handleStatsUpdate(message) {
      const { session_run_id, player_stats, event_id } = message;

      // Update stats history
      this.updateSessionStats(session_run_id, player_stats);

      // Update session cache
      sessionRunsApiInstance.updateCacheOnUpdate(session_run_id, player_stats);

      // Handle notifications
      if (event_id in EVENTS) {
        this.handleNotification(message);
      }
    },

    updateSessionStats(sessionId, newStats) {
      if (!newStats || (!newStats.earnedKamas && !newStats.estimatedKamasWon)) {
        return;
      }

      const currentStats = this.statsHistory[sessionId] || {
        earnedKamas: [],
        estimatedKamasWon: [],
        timestamps: [],
        nbrFightsDone: [],
        nbrTreasuresHuntsDone: []
      };

      const timestamp = new Date().toISOString();
      const lastIndex = currentStats.timestamps.length - 1;

      const lastValues = {
        earnedKamas: currentStats.earnedKamas[lastIndex] || 0,
        estimatedKamasWon: currentStats.estimatedKamasWon[lastIndex] || 0,
        nbrFightsDone: currentStats.nbrFightsDone[lastIndex] || 0,
        nbrTreasuresHuntsDone: currentStats.nbrTreasuresHuntsDone[lastIndex] || 0
      };

      const updatedStats = {
        ...this.statsHistory,
        [sessionId]: {
          timestamps: [...currentStats.timestamps, timestamp],
          earnedKamas: [...currentStats.earnedKamas, newStats.earnedKamas ?? lastValues.earnedKamas],
          estimatedKamasWon: [...currentStats.estimatedKamasWon, newStats.estimatedKamasWon ?? lastValues.estimatedKamasWon],
          nbrFightsDone: [...currentStats.nbrFightsDone, newStats.nbrFightsDone ?? lastValues.nbrFightsDone],
          nbrTreasuresHuntsDone: [...currentStats.nbrTreasuresHuntsDone, newStats.nbrTreasuresHuntsDone ?? lastValues.nbrTreasuresHuntsDone]
        }
      };

      this.statsHistory = updatedStats;
      console.log("history updated")
      storage.save(updatedStats);
    },

    handleWebSocketClose() {
      this.readyState = WebSocket.CLOSED;
      if (!this._isDisconnecting) {
        this.retryConnection();
      } else{
        this._isDisconnecting = false;
      }
    },

    handleWebSocketError(error) {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    },

    handleConnectionError() {
      this.readyState = WebSocket.CLOSED;
      this.retryConnection();
    },

    retryConnection() {
      if (this.retryCount >= MAX_RETRIES) {
        console.error("Maximum retry attempts reached");
        return;
      }

      this.retryCount++;
      setTimeout(() => this.initializeWebSocket(), RETRY_DELAY);
    },

    handleNotification(message) {
      this.notifications.push(message);

      const messages = {
        [EVENTS.PLAYER_LEVEL_UP]: `${message.character_name} has leveled up!`,
        [EVENTS.JOB_LEVEL_UP]: `${message.character_name} job leveled up!`
      };

      Notify.create({
        type: "info",
        message: messages[message.event_id] || "Unknown event",
        timeout: NOTIFY_TIMEOUT
      });
    },

    cleanupOldData() {
      const cleanedData = storage.removeOldData(this.statsHistory);
      this.statsHistory = cleanedData;
      storage.save(cleanedData);
    },

    clearSessionData(sessionId) {
      const newHistory = { ...this.statsHistory };
      delete newHistory[sessionId];
      this.statsHistory = newHistory;
      storage.save(newHistory);
    },

    clearAllData() {
      this.statsHistory = {};
      storage.save({});
      this.notifications = [];
    },

    disconnect() {
      this._isDisconnecting = true;
      console.log("Disconnect websocket called");
      if (this._socket) {
        this._socket.close(1000, "Intentional disconnect");
        this._socket = null;
        this.retryCount = 0;
      } else {
        console.log("Disconnect websocket called, but socket is null");
      }
    }
  }
});
