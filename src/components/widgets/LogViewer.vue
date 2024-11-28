<template>
  <q-card class="log-viewer-card">
    <q-card-section class="log-header">
      <div class="header-content">
        <div class="left-section">
          <div class="status-indicator"></div>
          <h3 class="log-title">{{ botName }} Logs</h3>
        </div>
        <q-btn-group outline class="log-actions">
          <q-btn flat class="action-btn" icon="delete" @click="clearLogs">
            <q-tooltip>Clear Logs</q-tooltip>
          </q-btn>
          <q-btn flat class="action-btn" :icon="selectMode ? 'cancel' : 'content_copy'" @click="toggleSelectMode">
            <q-tooltip>{{ selectMode ? 'Exit Select Mode' : 'Select Mode' }}</q-tooltip>
          </q-btn>
          <q-btn flat class="action-btn" icon="close" @click="quit">
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-btn-group>
      </div>
    </q-card-section>

    <q-card-section class="log-section">
      <div class="log-container" ref="logContainer" @scroll="handleScroll" @mousedown="stopAutoScroll" @mouseup="resumeAutoScroll">
        <div v-for="(log, index) in logs" :key="index" :class="['log-entry', { 'select-mode': selectMode }]" v-html="log"></div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { nextTick } from "vue";
import LoggingService from "src/api/loggingWebsocket";
import 'src/assets/css/fonts.css';

export default {
  name: "LogViewer",
  props: {
    botName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      logs: [],
      logContainer: null,
      autoScroll: true,
      scrollTimeout: null,
      selectMode: false, // Track select mode state
    };
  },
  methods: {
    addLogMessage(message) {
      this.logs.push(message);
      if (this.logs.length > 1000) {
        this.logs.shift();
      }
      if (this.autoScroll && !this.selectMode) {
        nextTick(() => {
          const container = this.$refs.logContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    },
    clearLogs() {
      this.logs = [];
    },
    quit() {
      LoggingService.stopLogStream(this.botName);
      LoggingService.closeWebSocket();
      this.goBack();
    },
    goBack() {
      this.$router.back();
    },
    stopAutoScroll() {
      this.autoScroll = false;
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
    },
    resumeAutoScroll() {
      this.scrollTimeout = setTimeout(() => {
        this.autoScroll = true;
      }, 5000); // Resume auto-scrolling after 5 seconds
    },
    handleScroll() {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => {
        this.autoScroll = true;
      }, 5000); // Resume auto-scrolling after 5 seconds
    },
    toggleSelectMode() {
      this.selectMode = !this.selectMode;
      if (this.selectMode) {
        this.stopAutoScroll();
      } else {
        this.resumeAutoScroll();
      }
    },
  },
  mounted() {
    this.logContainer = this.$refs.logContainer;
    LoggingService.connectWebSocket(this.botName);
    LoggingService.emitter.on("log_message", this.addLogMessage);
  },
  unmounted() {
    LoggingService.stopLogStream(this.botName);
    LoggingService.closeWebSocket();
    LoggingService.emitter.off("log_message", this.addLogMessage);
  },
};
</script>

<style>
/* These styles should be outside scoped to affect v-html content */
.log-entry span {
  font-family: 'JetBrains Mono', monospace !important;
}

.log-entry span[style*="color: #888"] {
  color: #a9b1d6 !important;
}

.log-entry pre {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.15 !important;  /* Made slightly tighter */
  font-size: 0.85rem !important;
  font-family: 'JetBrains Mono', monospace !important;
}

/* Scoped styles remain the same */
.log-viewer-card {
  background: #1a1b26;
  border: 1px solid #24283b;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Rest of your existing styles remain unchanged... */
</style>

<style scoped>
/* Non-scoped styles for v-html content */
.log-entry span {
  color: #c0caf5 !important;
}

.log-entry span[style*="color: #888"] {
  color: #a9b1d6 !important;
}

.log-entry pre {
  margin: 0 !important;
  line-height: 1.2 !important;
  font-size: 0.85rem !important;
}
/* Modern Dark Theme */
.log-viewer-card {
  background: #1a1b26;
  border: 1px solid #24283b;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-header {
  background: #24283b;
  padding: 0px 16px;
  border-bottom: 1px solid #414868;
  min-height: 48px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ece6a;
}

.log-title {
  color: #c0caf5;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
}

.log-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  color: #7aa2f7;
  font-size: 0.9rem;
  padding: 6px;
}

.log-section {
  flex: 1;
  padding: 0;
  background: #1a1b26;
}

.log-container {
  max-height: calc(100Svh - 100px);
  overflow-y: auto;
  padding: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.2;
  color: #c0caf5;
}

.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: #1a1b26;
}

.log-container::-webkit-scrollbar-thumb {
  background: #414868;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #565f89;
}

.log-entry {
  margin: 0;
  padding: 1px 6px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
  color: #c0caf5;
}

.log-entry:hover {
  background: #24283b;
}

.log-entry.select-mode {
  background: #24283b;
  cursor: text;
}

.log-entry pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: inherit;
}
</style>
