<template>
  <div class="q-pa-md q-gutter-md">
    <!-- Session Info Card -->
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
          <q-avatar class="q-mr-md" size="75px">
            <img :src="getCharacterAvatar(session)" />
          </q-avatar>
          <div>
            <q-item-label class="text-h6">{{ getSessionCharacter(session)?.name }} lvl {{ sessionRun?.currentLevel }}</q-item-label>
            <q-item-label>Server : {{ getSessionCharacter(session)?.serverName }}</q-item-label>
            <q-item-label>Activity : {{ session.type }}</q-item-label>
            <q-item-label class="text-h7">Current Status: <span class="highlight">{{ sessionRun?.status }}</span></q-item-label>
            <q-item-label class="text-h8">Current MapId: <span class="highlight">{{ sessionRun?.currentMapId }}</span></q-item-label>
            <!-- Added current path and sleeping status -->
            <q-item-label class="text-h8">Current Path: <span class="highlight">{{ sessionRun?.currentPathName || 'None' }}</span></q-item-label>
            <q-item-label class="text-h8">
              Status:
              <span class="highlight">{{ sessionRun?.isSleeping ? 'Sleeping' : 'Active' }}</span>
            </q-item-label>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Session Run Info Card -->
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
            <div class="section-title">Income & Earnings</div>
            <q-item-label>Earned Net Kamas: <span class="highlight">{{ sessionRun.earnedKamas }}</span></q-item-label>
            <q-item-label>Estimated Kamas Won: <span class="highlight">{{ sessionRun.estimatedKamasWon }}</span></q-item-label>
            <q-item-label>Kamas From Sales: <span class="highlight">{{ sessionRun.kamasEarnedSelling }}</span></q-item-label>
            <q-item-label>Earned Levels: <span class="highlight">{{ sessionRun.earnedLevels }}</span></q-item-label>
            <q-item-label>Job Levels Earned: <span class="highlight">{{ formatJobLevels(sessionRun.earnedJobLevels) }}</span></q-item-label>
          </div>
          <div class="details-column">
            <div class="section-title">Expenses & Activities</div>
            <q-item-label>Kamas Spent on Taxes: <span class="highlight">{{ sessionRun.kamasSpentOnTaxes }}</span></q-item-label>
            <q-item-label>Kamas Spent on Teleporting: <span class="highlight">{{ sessionRun.kamasSpentTeleporting }}</span></q-item-label>
            <q-item-label>Number of Teleports: <span class="highlight">{{ sessionRun.numberOfTeleports }}</span></q-item-label>
            <q-item-label>Kamas Spent on Bank: <span class="highlight">{{ sessionRun.kamasSpentOpeningBank }}</span></q-item-label>
          </div>
          <div class="details-column">
            <div class="section-title">Progress & Statistics</div>
            <q-item-label>Fights Done: <span class="highlight">{{ sessionRun.nbrFightsDone }}</span></q-item-label>
            <q-item-label>Treasures Hunts Done: <span class="highlight">{{ sessionRun.nbrTreasuresHuntsDone }}</span></q-item-label>
            <q-item-label>Deaths: <span class="highlight">{{ sessionRun.nbrOfDeaths }}</span></q-item-label>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Interactive Graphs -->
    <q-card v-if="!isSessionLoading && !isSessionError">
      <ProgressChart :sessionRunId="sessionRunId" />
    </q-card>
  </div>
</template>

<script setup>
import sessionRunsApiInstance from "src/api/sessionRuns";
import sessionApiInstance from "src/api/session";
import charactersApiInstance from "src/api/characters";
import ProgressChart from "components/widgets/ProgressChart.vue";

const props = defineProps({
  sessionRunId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
});

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

const {
  isLoading: isCharactersLoading,
  data: characters,
  isError: isCharactersError,
  error: charactersError,
} = charactersApiInstance.useGetItems();

const getSessionCharacter = (session) => {
  if (!characters.value) return null;
  return characters.value.find((character) => character.id == session.character);
};

const getCharacterAvatar = (session) => {
  const character = getSessionCharacter(session);
  return new URL(
    `/src/assets/classes/symbol_${character.breedId}.png`,
    import.meta.url
  ).href;
};

const formatJobLevels = (jobLevels) => {
  return Object.entries(jobLevels)
    .map(([jobId, level]) => `Job ${jobId}: ${level} levels`)
    .join(", ");
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
