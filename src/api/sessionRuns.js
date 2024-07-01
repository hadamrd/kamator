import BaseCrudApi from "./BaseCrudApi";

class SessionRunsApi extends BaseCrudApi {
  constructor() {
    super("/session-runs", "sessionRuns");
  }

  async stopSession(sessionRunId) {
    const response = api.post(`/${this.endpoint}/${sessionRunId}/stop/`);
    return response;
  }

  async clearHistory() {
    const response = await api.post(`/${this.endpoint}/clear_history/`);
    if (response.status === 200) {
      this.clearAllCache()
    }
  }

  async startSession(sessionId) {
    if (this.isSessionRunning(sessionId)) {
      console.error("Session already running");
      return;
    }
    let sessionRun = await this.createSessionRun({
      session: sessionId,
    });
    return sessionRun;
  }

}

const sessionRunsApiInstance = new SessionRunsApi();
export default sessionRunsApiInstance;
