<template>
  <div class="q-pa-md q-gutter-md">
    <!-- Session Info Card -->
    <q-card>
      <q-card-section>
        <div v-if="isSessionLoading" class="loading-container">
          <q-spinner color="primary" size="60px" />
          <q-item-label class="text-h6 q-mt-md"
            >Loading session data...</q-item-label
          >
        </div>
        <div v-else-if="isSessionError" class="error-container">
          <q-icon name="warning" color="negative" size="60px" />
          <q-item-label class="text-h6 q-mt-md"
            >Failed to load session data.</q-item-label
          >
          <q-item-label>{{ sessionError.message }}</q-item-label>
        </div>
        <div v-else class="row items-start">
          <!-- Character Info -->
          <div class="col-12 col-sm-6">
            <div class="row items-center">
              <div class="relative-position">
                <q-avatar class="q-mr-md character-avatar" size="75px">
                  <img
                    :src="getCharacterAvatar(session)"
                    :class="{ 'sleeping-filter': sessionRun?.isSleeping }"
                  />

                  <!-- Sleeping Effects Container -->
                  <div v-if="sessionRun?.isSleeping" class="sleeping-effects">
                    <!-- Z's Animation -->
                    <div class="sleeping-z-container">
                      <q-icon
                        name="favorite"
                        class="z-letter z1"
                        color="orange"
                        size="xs"
                      />
                      <q-icon
                        name="favorite"
                        class="z-letter z2"
                        color="orange"
                        size="sm"
                      />
                      <q-icon
                        name="favorite"
                        class="z-letter z3"
                        color="orange"
                      />
                    </div>

                    <!-- Moon Icon -->
                    <q-icon
                      name="nights_stay"
                      class="moon-icon"
                      color="orange"
                      size="sm"
                    />
                  </div>

                  <!-- Status Indicator -->
                  <div
                    class="status-indicator"
                    :class="{
                      sleeping: sessionRun?.isSleeping,
                      active: !sessionRun?.isSleeping,
                    }"
                  >
                    <q-tooltip>
                      <div class="row items-center q-gutter-sm">
                        <q-icon
                          :name="sessionRun?.isSleeping ? 'hotel' : 'person'"
                          size="xs"
                        />
                        {{ sessionRun?.isSleeping ? "Sleeping" : "Active" }}
                      </div>
                    </q-tooltip>
                  </div>
                </q-avatar>
              </div>
              <div>
                <q-item-label class="text-h6"
                  >{{ getSessionCharacter(session)?.name }} lvl
                  {{ sessionRun?.currentLevel }}</q-item-label
                >
                <q-item-label
                  >Server :
                  {{ getSessionCharacter(session)?.serverName }}</q-item-label
                >
                <q-item-label>Activity : {{ session.type }}</q-item-label>
                <q-item-label
                  >Current MapId:
                  <span class="highlight">{{
                    sessionRun?.currentMapId
                  }}</span></q-item-label
                >
                <q-item-label
                  >Current Path:
                  <span class="highlight">{{
                    sessionRun?.currentPathName || "None"
                  }}</span></q-item-label
                >
              </div>
            </div>
          </div>

          <!-- Stats Summary -->
          <div class="col-12 col-sm-6">
            <div class="row q-col-gutter-sm">
              <!-- Next Pause -->
              <div class="col-12">
                <div class="flex items-center">
                  <q-icon
                    name="schedule"
                    color="primary"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <div class="text-subtitle2">
                    Next Pause:
                    {{ formatTimestamp(sessionRun?.nextPauseTimestamp) }}
                  </div>
                </div>
              </div>

              <!-- Inventory Weight -->
              <div class="col-12">
                <div class="full-width">
                  <div class="flex justify-left text-caption q-mb-xs">
                    <q-icon
                      name="inventory_2"
                      color="primary"
                      size="sm"
                      class="q-mr-sm"
                    />
                    <span class="text-subtitle2"
                      >Inventory Load:
                      {{
                        formatPercent(sessionRun?.currentInventoryWeightPercent)
                      }}</span
                    >
                  </div>
                  <q-linear-progress
                    :value="
                      sessionRun?.currentInventoryWeightPercent / 100 || 0
                    "
                    :color="getInventoryProgressColor"
                    size="8px"
                    rounded
                  />
                </div>
              </div>

              <!-- Balances -->
              <div class="col-12 col-md-6">
                <div class="flex items-center">
                  <q-icon
                    name="account_balance"
                    color="amber"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <div>
                    <div class="text-caption">Bank</div>
                    <div class="text-subtitle2 text-weight-medium">
                      {{ formatKamas(sessionRun?.currentBankKamasBalance) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-6">
                <div class="flex items-center">
                  <q-icon
                    name="payments"
                    color="deep-orange"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <div>
                    <div class="text-caption">Inventory</div>
                    <div class="text-subtitle2 text-weight-medium">
                      {{
                        formatKamas(sessionRun?.currentInventoryKamasBalance)
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Session Run Info Card -->
    <q-card v-if="!isSessionLoading && !isSessionError">
      <q-card-section>
        <div v-if="isSessionRunLoading" class="loading-container">
          <q-spinner color="primary" size="60px" />
          <q-item-label class="text-h6 q-mt-md"
            >Loading session run data...</q-item-label
          >
        </div>
        <div v-else-if="isSessionRunError" class="error-container">
          <q-icon name="warning" color="negative" size="60px" />
          <q-item-label class="text-h6 q-mt-md"
            >Failed to load session run data.</q-item-label
          >
          <q-item-label>{{ sessionRunError.message }}</q-item-label>
        </div>
        <div v-else>
          <!-- Main expansion item that controls all sections -->
          <q-expansion-item
            group="stats"
            icon="assessment"
            label="Session Statistics"
            header-class="text-primary text-h6"
            :default-opened="false"
          >
            <div class="details-grid q-mt-md">
              <!-- Income Section -->
              <div class="details-column">
                <div class="section-header">
                  <q-icon
                    name="trending_up"
                    color="primary"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <span class="text-primary text-subtitle1"
                    >Income & Earnings</span
                  >
                </div>
                <q-card flat bordered>
                  <q-card-section>
                    <q-list dense>
                      <q-item>
                        <q-item-section>Earned Net Kamas</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.earnedKamas)
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Estimated Kamas Won</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.estimatedKamasWon)
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Kamas From Sales</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.kamasEarnedSelling)
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Earned Levels</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            sessionRun.earnedLevels
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Job Levels</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatJobLevels(sessionRun.earnedJobLevels)
                          }}</span></q-item-section
                        >
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <div class="vertical-separator"></div>

              <!-- Expenses Section -->
              <div class="details-column">
                <div class="section-header">
                  <q-icon
                    name="receipt_long"
                    color="primary"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <span class="text-primary text-subtitle1"
                    >Expenses & Activities</span
                  >
                </div>
                <q-card flat bordered>
                  <q-card-section>
                    <q-list dense>
                      <q-item>
                        <q-item-section>Taxes</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.kamasSpentOnTaxes)
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section
                          >Teleporting ({{
                            sessionRun.numberOfTeleports
                          }}
                          times)</q-item-section
                        >
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.kamasSpentTeleporting)
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Bank Fees</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            formatKamas(sessionRun.kamasSpentOpeningBank)
                          }}</span></q-item-section
                        >
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>

              <div class="vertical-separator"></div>

              <!-- Progress Section -->
              <div class="details-column">
                <div class="section-header">
                  <q-icon
                    name="analytics"
                    color="primary"
                    size="sm"
                    class="q-mr-sm"
                  />
                  <span class="text-primary text-subtitle1"
                    >Progress & Statistics</span
                  >
                </div>
                <q-card flat bordered>
                  <q-card-section>
                    <q-list dense>
                      <q-item>
                        <q-item-section>Fights Done</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            sessionRun.nbrFightsDone
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Treasures Hunts Done</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            sessionRun.nbrTreasuresHuntsDone
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Deaths</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            sessionRun.nbrOfDeaths
                          }}</span></q-item-section
                        >
                      </q-item>
                      <q-item>
                        <q-item-section>Fights lost</q-item-section>
                        <q-item-section side
                          ><span class="highlight">{{
                            sessionRun.nbrFightsLost
                          }}</span></q-item-section
                        >
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-expansion-item>
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
import { computed } from "vue";
import sessionRunsApiInstance from "src/api/sessionRuns";
import sessionApiInstance from "src/api/session";
import charactersApiInstance from "src/api/characters";
import ProgressChart from "components/widgets/ProgressChart.vue";

const props = defineProps({
  sessionRunId: { type: String, required: true },
  sessionId: { type: String, required: true },
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
  return characters.value.find(
    (character) => character.id == session.character
  );
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
// Add new formatting functions
const formatKamas = (amount) => {
  if (!amount) return "0";
  return new Intl.NumberFormat().format(amount);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Not scheduled";
  return new Date(timestamp * 1000).toLocaleString();
};

const formatPercent = (value) => {
  if (!value) return "0%";
  return `${value.toFixed(1)}%`;
};

const getInventoryProgressColor = computed(() => {
  const weight = sessionRun.value?.currentInventoryWeightPercent || 0;
  if (weight >= 90) return "negative";
  if (weight >= 75) return "warning";
  return "positive";
});
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
  gap: 1rem;
}

.details-column {
  flex: 1;
  min-width: 200px;
}

.highlight {
  font-weight: bold;
  color: #1976d2;
}

.section-title {
  font-weight: 500;
  color: #666;
  margin-bottom: 0.5rem;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 18px; /* Adjusted to account for q-mr-md spacing */
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: var(--q-positive);
}

.status-indicator.sleeping {
  background: var(--q-orange);
}

.details-grid {
  display: flex;
  gap: 0; /* Remove gap since we're using separators */
  align-items: stretch;
}

.details-column {
  flex: 1;
  min-width: 200px;
  padding: 0 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.vertical-separator {
  width: 1px;
  background-color: #e0e0e0;
  margin: 0.5rem 0;
}

/* Make sure first and last columns don't have extra padding */
.details-column:first-child {
  padding-left: 0;
}

.details-column:last-child {
  padding-right: 0;
}

.status-container {
  position: absolute;
  bottom: 2px;
  right: 18px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-indicator.sleeping {
  background: var(--q-orange);
  animation: pulse 2s infinite;
}

.status-indicator.active {
  background: var(--q-positive);
}

.sleeping-badge {
  bottom: 15px;
  right: 15px;
  padding: 4px 8px;
}

.sleeping-icon {
  animation: float 2s infinite ease-in-out;
}

.rotate-z {
  animation: rotate 4s linear infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
