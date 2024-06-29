<template>
    <div class="q-gutter-sm">
        <q-bar dense class="bg-teal text-white" style="position: fixed; margin-left: 0; bottom: 0; left: 0; width: 100%; height: 18px">
            <q-space />
            <div class="websocket-status-text">WebSocket:</div>
            <div class="status-indicator" :style="{ backgroundColor: wsColor }"></div>
        </q-bar>
    </div>
</template>

<script>
import { useWebSocketStore } from 'stores/webSockets'; // Path to your store

export default {
    name: 'TaskbarView',
    setup() {
        const wsstore = useWebSocketStore();
        return { wsstore };
    },
    computed: {
        wsColor() {
            switch (this.wsstore.readyState) {
                case WebSocket.OPEN:
                    return 'green';
                case WebSocket.CONNECTING:
                    return 'yellow';
                case WebSocket.CLOSING:
                    return 'orange';
                default:
                    return 'red';
            }
        }
    }
};
</script>

<style scoped>
.taskbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
}

.q-toolbar {
    padding: 2px 10px;
    /* Reduce vertical padding */
    min-height: 32px;
    /* Adjust minimum height for a tighter fit */
}

.q-toolbar-title {
    font-size: 14px;
    /* Optional: Adjust font size if needed */
    line-height: 1;
    /* Reduce line height to minimize excess vertical space */
}

.toolbar-content {
    display: flex;
    align-items: center;
    height: 100%;
    /* Ensure full height alignment */
    font-size: 9px;
    /* Optional: Adjust font size if needed */
}

.websocket-status-text {
    font-size: 9px;
}
.status-indicator {
    width: 8px;
    /* Small circle size */
    height: 8px;
    border-radius: 50%;
    margin-left: 5px;
    align-self: center;
    margin-right: 20px
    /* Ensure the indicator is vertically centered */
}
</style>