<template>
  <q-card class="log-viewer-card">
    <q-card-section>
      <div class="log-header">
        <h3 class="log-title">Bot Logs for {{ botName }}</h3>
        <div class="log-actions">
          <q-btn color="primary" class="log-action-btn" @click="clearLogs">Clear Logs</q-btn>
          <q-btn color="warning" class="log-action-btn" @click="toggleSelectMode">{{ selectMode ? 'Exit Select Mode' : 'Select Mode' }}</q-btn>
          <q-btn color="negative" class="log-action-btn" @click="quit">Quit</q-btn>
        </div>
      </div>
      <div class="log-container" ref="logContainer" @scroll="handleScroll" @mousedown="stopAutoScroll" @mouseup="resumeAutoScroll">
        <div v-for="(log, index) in logs" :key="index" :class="['log-entry', { 'select-mode': selectMode }]" v-html="log"></div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref, nextTick } from 'vue';
import { Notify } from 'quasar';
import LoggingService from 'src/api/loggingWebsocket';

export default {
  name: 'LogViewer',
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
      if (this.logs.length > 500) {
        this.logs.shift();
      }
      if (this.autoScroll && !this.selectMode) { // Only auto-scroll if not in select mode
        // Scroll to bottom
        nextTick(() => {
          const container = this.logContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    },
    clearLogs() {
      this.logs = [];
      console.log('Logs cleared');
      Notify.create({
        type: 'positive',
        message: 'Logs cleared!',
      });
    },
    quit() {
      LoggingService.stopLogStream(this.botName);
      LoggingService.closeWebSocket();
      Notify.create({
        timeout: 500,
        type: 'warning',
        message: 'Logging session ended',
      });
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
      }, 3000); // Resume auto-scrolling after 3 seconds
    },
    handleScroll() {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => {
        this.autoScroll = true;
      }, 3000); // Resume auto-scrolling after 3 seconds
    },
    toggleSelectMode() {
      this.selectMode = !this.selectMode;
      if (this.selectMode) {
        this.stopAutoScroll();
      } else {
        this.resumeAutoScroll();
      }
    }
  },
  mounted() {
    this.logContainer = this.$refs.logContainer;
    LoggingService.connectWebSocket(this.botName);
    LoggingService.emitter.on('log_message', this.addLogMessage);
  },
  unmounted() {
    LoggingService.stopLogStream(this.botName);
    LoggingService.closeWebSocket();
    LoggingService.emitter.off('log_message', this.addLogMessage);
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cascadia+Code:wght@400&display=swap');

.log-viewer-card {
  display: flex;
  flex-direction: column;
  border: 2px solid #268bd2; /* Solarized Blue border */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2aa198; /* Solarized Cyan background */
  color: #fdf6e3; /* Solarized Light foreground */
  padding: 10px;
  border-radius: 4px 4px 0 0;
  border-bottom: 2px solid #268bd2; /* Solarized Blue border */
}

.log-title {
  font-size: 1.2rem; /* Smaller header text */
  margin: 0;
}

.log-actions {
  display: flex;
  gap: 10px;
}

.log-action-btn {
  padding: 5px 10px;
}

.log-container {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #fdf6e3; /* Solarized Light background */
  color: #657b83; /* Solarized Light text color */
  padding: 5px; /* Reduce padding */
  font-family: 'Cascadia Code', Courier, monospace; /* Use Cascadia Code font */
  font-size: 0.875rem; /* Font size */
  line-height: 1.1; /* Line height */
  font-weight: 550; /* Normal font weight */
}

.log-entry {
  padding: 0; /* Remove padding */
  margin: 0; /* Remove margin */
  transition: background-color 0.3s;
}

.log-entry:hover {
  background-color: #eee8d5; /* Solarized Light highlight */
}

.log-entry.select-mode {
  background-color: #eee8d5; /* Highlight in select mode */
  cursor: text; /* Indicate selectable text */
}

.q-btn {
  background-color: #cb4b16 !important; /* Solarized Orange */
  color: #fdf6e3 !important; /* Solarized Light foreground */
}

.q-btn:hover {
  background-color: #d33682 !important; /* Solarized Magenta */
}
</style>
