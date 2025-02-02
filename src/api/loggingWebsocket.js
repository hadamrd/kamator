import mitt from "mitt";

const emitter = mitt();

const LoggingService = (() => {
  let ws = null;

  const connectWebSocket = (botName) => {
    console.log("Connecting to WebSocket...");

    ws = new WebSocket(import.meta.env.VITE_LOGGING_ENDPOINT);
    ws.onopen = () => {
      console.log("WebSocket connected");
      startLogStream(botName);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "log_message" && data.bot_name === botName) {
        data.log_entries.forEach((entry) => {
          emitter.emit("log_message", entry);
        });
      }
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.onclose = () => {
      console.log("WebSocket closed");
    };
  };

  const startLogStream = (botName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: "start_watch_logs",
          data: { bot_name: botName },
        })
      );
      console.log(`Started watching logs for bot: ${botName}`);
    }
  };

  const stopLogStream = (botName) => {
    console.log("ws state :", ws.readyState)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: "stop_watch_logs",
          data: { bot_name: botName },
        })
      );
      console.log(`Stopped watching logs for bot: ${botName}`);
    }
  };

  const closeWebSocket = () => {
    if (ws) {
      ws.close();
    }
  };

  return {
    connectWebSocket,
    stopLogStream,
    closeWebSocket,
    emitter,
  };
})();

export default LoggingService;
