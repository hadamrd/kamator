import BaseCrudApi from "./BaseCrudApi";
import { api } from "src/boot/axios";
import { queryClient } from "src/boot/vue-query";
import { useMutation } from "@tanstack/vue-query";
class SessionRunsApi extends BaseCrudApi {
  constructor() {
    super("/session-runs", "sessionRuns");
  }

  async stopSession(sessionRunId) {
    const response = api.post(`${this.endpoint}/${sessionRunId}/stop/`);
    return response;
  }

  useClearHistory() {
    return useMutation({
      mutationFn: () => this.clearHistory(),
      onSuccess: () => {
        // Invalidate and reset queries after successful clear
        queryClient.invalidateQueries([this.cacheKey, "list"]);
        queryClient.setQueryData([this.cacheKey, "list"], []);
      },
    });
  }

  async clearHistory() {
    const response = await api.post(`${this.endpoint}/clear_history/`);
    if (response.status !== 200) {
      throw new Error('Failed to clear history');
    }
    return response.data;
  }

  async startSession(sessionId) {
    if (await this.isSessionRunning(sessionId)) {
      return;
    }
    let sessionRun = await this.createSessionRun({
      session: sessionId,
    });
    return sessionRun;
  }

  async isSessionRunning(sessionId) {
    const cachedData = queryClient.getQueryData([this.cacheKey, "all"]);

    if (!cachedData) {
      const cachedData = await this.getItems();
      if (!cachedData) {
        return false;
      }

      queryClient.setQueryData([this.cacheKey, "all"], cachedData);
    }

    let sessionRun = cachedData.find((sr) => sr.session === sessionId);

    if (!sessionRun) {
      return false;
    }

    return (
      sessionRun &&
      sessionRun.status !== SessionStatusEnum.TERMINATED &&
      sessionRun.status !== SessionStatusEnum.CRASHED &&
      sessionRun.status !== SessionStatusEnum.STOPPED
    );
  }
}

const sessionRunsApiInstance = new SessionRunsApi();
export default sessionRunsApiInstance;
