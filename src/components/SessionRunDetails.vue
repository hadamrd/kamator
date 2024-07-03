<template>
  <div class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div v-if="isSessionLoading" class="loading-container">
          <q-spinner color="primary" size="60px" />
          <q-item-label class="text-h6 q-mt-md">Loading session data...</q-item-label>
        </div>
        <div v-else-if="isSessionError" class="error-container">
          <q-icon name="warning" color="negative" size="60px" />
          <q-item-label class="text-h6 q-mt-md">Failed to load session data.</q-item-label>
          <q-item-label>{{ sessionError.message }}</q-item-label>
        </div>
        <div v-else class="session-container">
          <q-avatar class="q-mr-md">
            <img :src="getSessionImage(session)" />
          </q-avatar>
          <div>
            <q-item-label class="text-h6">{{ session.id }}</q-item-label>
            <q-item-label>{{ session.character.serverName }}</q-item-label>
            <q-item-label>{{ session.type }}</q-item-label>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="!isSessionLoading && !isSessionError">
      <q-card-section>
        <div v-if="isSessionRunLoading" class="loading-container">
          <q-spinner color="primary" size="60px" />
          <q-item-label class="text-h6 q-mt-md">Loading session run data...</q-item-label>
        </div>
        <div v-else-if="isSessionRunError" class="error-container">
          <q-icon name="warning" color="negative" size="60px" />
          <q-item-label class="text-h6 q-mt-md">Failed to load session run data.</q-item-label>
          <q-item-label>{{ sessionRunError.message }}</q-item-label>
        </div>
        <div v-else class="details-grid">
          <div class="details-column">
            <q-item-label>Earned Kamas: <span class="highlight">{{ sessionRun.earnedKamas }}</span></q-item-label>
            <q-item-label>Earned Levels: <span class="highlight">{{ sessionRun.earnedLevels }}</span></q-item-label>
            <q-item-label>Fights Done: <span class="highlight">{{ sessionRun.nbrFightsDone }}</span></q-item-label>
            <q-item-label>Treasures Hunts Done: <span class="highlight">{{ sessionRun.nbrTreasuresHuntsDone }}</span></q-item-label>
            <q-item-label>Job Levels Earned: <span class="highlight">{{ formatJobLevels(sessionRun.earnedJobLevels) }}</span></q-item-label>
          </div>
          <div class="details-column">
            <q-item-label>Estimated Kamas Won: <span class="highlight">{{ sessionRun.estimatedKamasWon }}</span></q-item-label>
            <q-item-label>Deaths: <span class="highlight">{{ sessionRun.nbrOfDeaths }}</span></q-item-label>
            <q-item-label>Kamas Spent on Teleporting: <span class="highlight">{{ sessionRun.kamasSpentTeleporting }}</span></q-item-label>
            <q-item-label>Number of Teleports: <span class="highlight">{{ sessionRun.numberOfTeleports }}</span></q-item-label>
            <q-item-label>Kamas Spent on Opening Bank: <span class="highlight">{{ sessionRun.kamasSpentOpeningBank }}</span></q-item-label>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-tabs v-model="currentTab" class="q-mt-md">
      <q-tab name="actions" label="Actions" />
      <q-tab name="log" label="Log" />
    </q-tabs>

    <q-tab-panels v-model="currentTab" animated>
      <q-tab-panel name="actions">
        <q-list bordered> <!-- Actions list will be implemented later --> </q-list>
      </q-tab-panel>
      <q-tab-panel name="log">
        <!-- Log display will be implemented later -->
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import { ref } from 'vue';
import sessionRunsApiInstance from 'src/api/sessionRuns';
import sessionApiInstance from 'src/api/session';

export default {
  name: 'SessionRunDetails',
  props: {
    sessionRunId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const {
      isLoading: isSessionRunLoading,
      isError: isSessionRunError,
      data: sessionRun,
      error: sessionRunError,
    } = sessionRunsApiInstance.useGetItem(props.sessionRunId);
  
    const {
      isLoading: isSessionLoading,
      isError: isSessionError,
      data: session,
      error: sessionError,
    } = sessionApiInstance.useGetItem(props.sessionId);

    const currentTab = ref('actions');

    const getSessionImage = (session) => {
      return sessionApiInstance.getSessionImage(session);
    };

    const formatJobLevels = (jobLevels) => {
      return Object.entries(jobLevels)
        .map(([jobId, level]) => `Job ${jobId}: ${level} levels`)
        .join(', ');
    };

    return {
      isSessionRunLoading,
      isSessionRunError,
      sessionRun,
      sessionRunError,
      isSessionLoading,
      isSessionError,
      session,
      sessionError,
      currentTab,
      getSessionImage,
      formatJobLevels,
    };
  },
};
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.session-container {
  display: flex;
  align-items: center;
}

.details-grid {
  display: flex;
  flex-wrap: wrap;
}

.details-column {
  flex: 1;
  min-width: 200px;
}

.highlight {
  font-weight: bold;
  color: #1976d2;
}
</style>
