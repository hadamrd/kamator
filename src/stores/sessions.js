import { defineStore } from "pinia";
import { api } from "boot/axios";
import { SessionTypeEnum, UnloadTypeEnum } from "src/enums/sessionEnums";
import { useSessionRunStore } from "stores/sessionRuns";

export const useSessionStore = defineStore("sessions", {
  state: () => {
    const sessionRunStore = useSessionRunStore();
    const sessionTypesChoices = [
      {
        value: SessionTypeEnum.SOLO_FIGHT,
        label: "Solo Fight",
      },
      {
        value: SessionTypeEnum.GROUP_FIGHT,
        label: "Group Fight",
      },
      {
        value: SessionTypeEnum.FARM,
        label: "Farm",
      },
      {
        value: SessionTypeEnum.SELL,
        label: "Sell",
      },
      {
        value: SessionTypeEnum.TREASURE_HUNT,
        label: "Treasure Hunt",
      },
      {
        value: SessionTypeEnum.MIXED,
        label: "Mixed",
      },
      {
        value: SessionTypeEnum.MULE_FIGHT,
        label: "Mule Fight",
      },
      {
        value: SessionTypeEnum.MULTIPLE_PATHS_FARM,
        label: "Multiple Paths Farm",
      },
    ];
    const sessionUnloadTypeChoices = [
      {
        value: UnloadTypeEnum.BANK,
        label: "unload in bank",
      },
      {
        value: UnloadTypeEnum.SELLER,
        label: "unload in seller",
      },
      {
        value: UnloadTypeEnum.STORAGE,
        label: "unload in storage",
      },
    ];
    return {
      sessions: null,
      sessions_runs: null,
      sessionTypesChoices,
      sessionUnloadTypeChoices,
      sessionRunStore,
    };
  },
  getters: {
    getSessionTypeForm: () => {
      return (sessionType) => {
        switch (sessionType) {
          case SessionTypeEnum.SOLO_FIGHT:
            return "SoloFightSessionForm";
          case SessionTypeEnum.TREASURE_HUNT:
            return "TreasureHuntSessionForm";
          case SessionTypeEnum.FARM:
            return "FarmSessionForm";
          case SessionTypeEnum.GROUP_FIGHT:
            return "GroupFightSessionForm";
          case SessionTypeEnum.MULE_FIGHT:
            return "MuleFightSessionForm";
          default:
            return null;
        }
      };
    },
  },
  actions: {
    async fetchSessionDetails(sessionId) {
      try {
        const response = await api.get(`/sessions/${sessionId}`);
        return response.data;
      } catch (error) {
        console.error("Failed to fetch session:", error);
        return null;
      }
    },
    async fetchSessions() {
      try {
        const response = await api.get("/sessions");
        this.sessions = response.data;
        return response.data;
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return [];
      }
    },
    async getSessions() {
      if (this.sessions === null) await this.fetchSessions();
      return this.sessions;
    },
    async getSession(sessionId) {
      if (this.sessions === null) await this.fetchSessions();
      return this.sessions.find((session) => session.id === sessionId);
    },
    async getSessionDetails(sessionId) {
      if (this.sessions.length > 0) {
        return this.sessions.find((session) => session.id === sessionId);
      }
      return await this.fetchSessionDetails(sessionId);
    },
    async getSessionRuns(sessionId) {
      if (this.sessions_runs.length > 0) {
        return this.sessions_runs.filter(
          (session) => session.sessionId === sessionId
        );
      }
      return (await this.fetchSessionsRuns()).filter(
        (session) => session.sessionId === sessionId
      );
    },
    async fetchSessionsRuns() {
      try {
        const response = await api.get("/sessions/runs");
        this.sessions_runs = response.data;
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    },
    async deleteSession(sessionId) {
      // check if the session is running
      if (this.sessionRunStore.isSessionRunning(sessionId))
        throw new Error("Cannot delete a session that is currently running");
      try {
        await api.delete(`/sessions/${sessionId}`);
        this.sessions = this.sessions.filter(
          (session) => session.id !== sessionId
        );
        return this.sessions;
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    },
    async createSession(sessionData) {
      const response = await api.post("/sessions/", sessionData);
      if (response.data) this.sessions.push(response.data);
      return response.data;
    },
    async runTreasureHunt(accountId, characterId) {
      try {
        const response = await api.post("/sessions/runs", {
          accountId: accountId,
          characterId: characterId,
          sessionData: {
            id: `treasurehunt-${characterId}`,
            type: SessionTypeEnum.TREASURE_HUNT,
          },
        });
        console.log("Treasurehunt response:", response.data);
      } catch (error) {
        console.error("Error starting treasurehunt:", error);
        // Handle error, e.g., showing an error message to the user
      }
    },
  },
});
