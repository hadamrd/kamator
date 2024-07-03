import BaseCrudApi from "./BaseCrudApi";
import { api } from "src/boot/axios";
import { queryClient } from "src/boot/vue-query";

class SessionRunsApi extends BaseCrudApi {
  constructor() {
    super("/session-runs", "sessionRuns");
  }

  async stopSession(sessionRunId) {
    const response = api.post(`${this.endpoint}/${sessionRunId}/stop/`);
    return response;
  }

  async clearHistory() {
    const response = await api.post(`${this.endpoint}/clear_history/`);
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

  async isSessionRunning(sessionId) {
    const cachedData = queryClient.getQueryData([this.cacheKey, 'all']);

    if (!cachedData) {
      const cachedData = await this.getItems();

      if (!cachedData) {
        return false;
      }

      queryClient.setQueryData([this.cacheKey, 'all'], cachedData);
    }

    let sessionRun = cachedData.find((sr) => sr.session === sessionId);

    if (!sessionRun) {
      // If the session run is not found in cache, fetch it
      sessionRun = await this.getItem(sessionId);

      if (sessionRun) {
        // Update cache with the fetched session run
        queryClient.setQueryData([this.cacheKey, 'all'], (oldData) => [...oldData, sessionRun]);
      } else {
        return false;
      }
    }

    const isRunning = sessionRun &&
      sessionRun.status !== SessionStatusEnum.TERMINATED &&
      sessionRun.status !== SessionStatusEnum.CRASHED &&
      sessionRun.status !== SessionStatusEnum.STOPPED;

    return isRunning;
  }

  async updateSessionStats(sessionRunId, statsData) {
    // Fetch the item if it's not in the specific item cache
    let updatedSessionRun = queryClient.getQueryData([this.cacheKey, sessionRunId]);
    if (!updatedSessionRun) {
      updatedSessionRun = await this.getItem(sessionRunId);
    }
    // Merge the statsData into the fetched item
    updatedSessionRun = { ...updatedSessionRun, ...statsData };

    // Update the specific item's cache
    queryClient.setQueryData([this.cacheKey, sessionRunId], updatedSessionRun);

    const allItems = queryClient.getQueryData([this.cacheKey, 'all']);
    if (allItems) {
      const sessionRunIndex = allItems.findIndex((sr) => sr && sr.id === sessionRunId);
      if (sessionRunIndex > -1) {
        const newData = [...allItems];
        newData[sessionRunIndex] = updatedSessionRun;
        queryClient.setQueryData([this.cacheKey, 'all'], newData);
      } else {
        queryClient.setQueryData([this.cacheKey, 'all'], [...allItems, updatedSessionRun]);
      }
    } else {
      const allItemsFetched = await this.getItems();
      queryClient.setQueryData([this.cacheKey, 'all'], allItemsFetched);
    }
  }

  updateSessionStatus(sessionRunId, newStatus) {
    this.updateSessionStats(sessionRunId, {status: newStatus})
  }
}

const sessionRunsApiInstance = new SessionRunsApi();
export default sessionRunsApiInstance;
