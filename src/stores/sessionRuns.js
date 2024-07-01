/* eslint-disable no-unused-vars */
import { defineStore } from "pinia";
import { api } from "boot/axios";
import { SessionStatusEnum } from "src/enums/sessionEnums";

export const useSessionRunStore = defineStore("sessionRun", {
  state: () => ({
    sessions_runs: null,
  }),
  getters: {
    isSessionRunning: (state) => (sessionId) => {
      if (state.sessions_runs == null) return false;
      let session_run = state.getSessionCurrentRun(sessionId);
      let is_running =
        session_run != null &&
        session_run.status !== SessionStatusEnum.TERMINATED &&
        session_run.status !== SessionStatusEnum.CRASHED &&
        session_run.status !== SessionStatusEnum.STOPPED;
      return is_running;
    },
    getSessionRunsHistory: (state) => (sessionId) => {
      if (state.sessions_runs == null) return null;
      return state.sessions_runs.find(
        (session_run) => session_run.session === sessionId
      );
    },
    getSessionCurrentRun: (state) => (sessionId) => {
      if (state.sessions_runs == null) return null;
      let session_run = state.sessions_runs.find(
        (session_run) =>
          session_run.session === sessionId &&
          session_run.exitStatus == null &&
          session_run.status != SessionStatusEnum.TERMINATED &&
          session_run.status != SessionStatusEnum.CRASHED
      );
      return session_run;
    },
    getSessionStatus: (state) => (sessionId) => {
      if (state.sessions_runs == null) return null;
      let session_run = state.getSessionCurrentRun(sessionId);
      if (session_run == null) return SessionStatusEnum.DOWN;
      return session_run.status;
    },
  },
  actions: {
    updateSessionStatus(sessionRunId, newStatus, details) {
      if (this.sessions_runs == null) {
        console.error("Session runs not loaded");
        return;
      }
      let sessionRun = this.sessions_runs.find((sr) => sr.id == sessionRunId);
      if (sessionRun) {
        sessionRun.status = newStatus;
      } else {
        console.error("Session run not found");
        this.fetchSessionRunDetails(sessionRunId).then((runDetails) => {
          this.sessions_runs.push(runDetails);
        });
      }
    },
    updateSessionStats(sessionRunId, statsData) {
      if (this.sessions_runs == null) {
        console.error("Session runs not loaded");
        return;
      }
      let sessionRun = this.sessions_runs.find((sr) => sr.id == sessionRunId);
      if (sessionRun) {
        sessionRun.currentLevel = statsData.currentLevel;
        sessionRun.earnedLevels = statsData.earnedLevels;
        sessionRun.nbrFightsDone = statsData.nbrFightsDone;
        sessionRun.estimatedKamasWon = statsData.estimatedKamasWon;
        sessionRun.earnedKamas = statsData.earnedKamas;
        sessionRun.nbrOfDeaths = statsData.nbrOfDeaths;
      } else {
        console.error("Session run not found");
        this.fetchSessionRunDetails(sessionRunId).then((runDetails) => {
          this.sessions_runs.push(runDetails);
        });
      }
    },
    async getSessionsRuns() {
      if (this.sessions_runs == null) await this.fetchSessionsRuns();
      return this.sessions_runs;
    },
    async fetchSessionsRuns() {
      const response = await api.get("/session-runs");
      this.sessions_runs = response.data;
    },
    async fetchSessionRunDetails(sessionRunId) {
      try {
        const response = await api.get(`/session-runs/${sessionRunId}`);
        return response.data;
      } catch (err) {
        console.log("Failed to fetch session run details");
        return null;
      }
    },
    async stopSession(sessionId) {
      let sessionRun = this.sessions_runs.find(
        (session_run) =>
          session_run.session === sessionId && session_run.exitStatus == null
      );
      if (sessionRun == null) {
        console.error("Session run not found");
        return;
      }
      const response = api.post(`/session-runs/${sessionRun.id}/stop/`);
      if (response.status === 200) console.log(response.data);
    },
    async clearHistory() {
      const response = await api.post("/session-runs/clear_history/");
      if (response.status === 200) {
        this.sessions_runs = [];
      }
    },
    async startSession(sessionId) {
      if (this.isSessionRunning(sessionId)) {
        console.error("Session already running");
        return;
      }
      let sessionRun = await this.createSessionRun({
        session: sessionId,
      });
      return sessionRun;
    },
    async createSessionRun(data) {
      let response;
      try {
        response = await api.post("/session-runs/", data);
      } catch (error) {
        console.log("Failed to run session", error);
        return null;
      }
      if (this.sessions_runs == null) await this.fetchSessionsRuns();
      if (this.sessions_runs == null) this.sessions_runs = [];
      if (
        this.sessions_runs.find((session_run) => session_run.id === data.id)
      ) {
        console.error("Session run already exists");
        return null;
      }
      this.sessions_runs.push(response.data);
      return response.data;
    },
  },
});
