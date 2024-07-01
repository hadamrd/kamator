import { defineStore } from "pinia";
import { api } from "boot/axios";

export const useGameDataStore = defineStore("gameData", {
  state: () =>
    // dofus data is a dict with jobs, resources, skills
    // skills is a dict with skillId as key and skill as value
    // skill is a dict with id (jobid), name, getheredResources
    // gatheredResources is a list of dict with id, name, levelMin
    ({
      gameData: null,
    }),
  getters: {
    getJobGatherableResources: (state) => (jobId) => {
      if (typeof jobId !== "number") {
        console.error("jobId is not a number!", jobId);
        return [];
      }
      let skill = state.gameData.skills[jobId];
      if (skill == null) {
        return [];
      }
      return state.gameData.skills[jobId]?.gatheredRessources;
    },
    getJobs: (state) => {
      return state.gameData.jobs;
    },
    getSkills: (state) => {
      return () => {
        return state.gameData.skills;
      };
    },
  },
  actions: {
    async getGameData() {
      if (this.gameData == null) {
        await this.fetchGameData();
      }
      return this.gameData;
    },
    async fetchGameData() {
      try {
        const response = await api.get("/dofus-data/");
        this.gameData = response.data;
      } catch (error) {
        console.error("There was an error fetching dofus data:", error);
      }
    },
  },
});
