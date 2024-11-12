<template>
  <div>
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="header">
          <div class="row items-center full-width q-col-gutter-md">
            <div class="col-grow">
              <div class="text-h6">Sessions Running</div>
            </div>
            <div class="col-auto">
              <q-input
                v-model="searchTerm"
                dense
                outlined
                placeholder="Search sessions..."
                class="q-mr-md"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-auto">
              <q-toggle
                v-model="showTerminated"
                label="Show Terminated"
                color="primary"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="negative"
                label="Clear History"
                icon="delete"
                :loading="isClearingHistory"
                @click="confirmClearHistory"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="filteredRows"
          :columns="columns"
          row-key="id"
          :loading="isSessionRunsLoading"
          binary-state-sort
          :pagination="pagination"
          flat
          bordered
          class="session-table"
          :filter="searchTerm"
        >
          <!-- Runtime column template -->
          <template v-slot:body-cell-runTime="props">
            <q-td :props="props" class="text-left">
              {{ calculateRunTime(props.row.startTime, props.row.endTime) }}
            </q-td>
          </template>

          <!-- Status column template -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props" class="text-center">
              <q-chip
                :color="getStatusColor(props.row.status)"
                text-color="white"
                size="sm"
                class="text-capitalize"
              >
                {{ formatStatus(props.row.status) }}
              </q-chip>
            </q-td>
          </template>

          <!-- Kamas earned column template -->
          <template v-slot:body-cell-earnedKamas="props">
            <q-td :props="props" class="text-right">
              <div class="row items-center justify-end">
                <q-icon name="payments" size="xs" class="q-mr-sm" />
                {{ formatNumber(props.row.earnedKamas) }}
              </div>
            </q-td>
          </template>

          <!-- Estimated Kamas column template -->
          <template v-slot:body-cell-estimatedKamasWon="props">
            <q-td :props="props" class="text-right">
              <div class="row items-center justify-end">
                <q-icon
                  :name="
                    props.row.earnedKamas < 0 ? 'trending_down' : 'trending_up'
                  "
                  :class="
                    props.row.earnedKamas < 0
                      ? 'text-negative'
                      : 'text-positive'
                  "
                  size="xs"
                  class="q-mr-sm"
                />
                {{ formatNumber(calculateEstimatedKamas(props.row)) }}
              </div>
            </q-td>
          </template>

          <!-- Earned Levels column template -->
          <template v-slot:body-cell-earnedLevels="props">
            <q-td :props="props" class="text-right">
              <div class="row items-center justify-end">
                <q-icon name="stars" size="xs" class="q-mr-sm" />
                {{ props.row.earnedLevels || 0 }}
              </div>
            </q-td>
          </template>

          <!-- Current Level template -->
          <template v-slot:body-cell-currentLevel="props">
            <q-td :props="props" class="text-right">
              {{ props.row.currentLevel || 0 }}
            </q-td>
          </template>

          <!-- Actions column template -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-center">
              <q-btn
                flat
                dense
                :to="{
                  name: 'SessionRunDetails',
                  params: {
                    sessionRunId: props.row.id,
                    sessionId: props.row.session,
                  },
                }"
                icon="launch"
                class="q-mr-sm"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                icon="delete"
                @click.stop="confirmDelete(props.row)"
              >
                <q-tooltip>Delete Session</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- No data message -->
          <template v-slot:no-data>
            <div class="full-width row flex-center q-pa-md text-grey-6">
              No sessions found
            </div>
          </template>
        </q-table>
      </q-card-section>

      <!-- Loading spinner -->
      <q-card-section v-if="isSessionRunsLoading">
        <div class="row justify-center">
          <q-spinner color="primary" size="3em" />
        </div>
      </q-card-section>

      <!-- Error message -->
      <q-card-section v-if="isSessionRunsError">
        <div class="text-negative">
          Error loading session runs: {{ sessionRunsError.message }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Delete confirmation dialog -->
    <q-dialog v-model="deleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm"
            >Are you sure you want to delete this session?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="deleteSessionRun"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Add Clear History confirmation dialog -->
    <q-dialog v-model="clearHistoryDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">
            Are you sure you want to clear all session history? This action
            cannot be undone.
          </span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Clear History"
            color="negative"
            :loading="isClearingHistory"
            @click="handleClearHistory"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Error handling for clear history -->
    <q-dialog v-model="isClearHistoryError">
      <q-card>
        <q-card-section>
          <div class="text-h6">Error</div>
          <p class="text-negative">
            Failed to clear history: {{ clearHistoryError?.message }}
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import sessionRunsApiInstance from "src/api/sessionRuns";
import { SessionStatusEnum, SessionTypeEnum } from "src/enums/sessionEnums";

export default {
  name: "SessionRunList",
  emits: ["select-session"],

  setup() {
    const {
      isLoading: isSessionRunsLoading,
      data: sessionRuns,
      isError: isSessionRunsError,
      error: sessionRunsError,
    } = sessionRunsApiInstance.useGetItems();

    const {
      mutate: clearHistory,
      isLoading: isClearingHistory,
      isError: isClearHistoryError,
      error: clearHistoryError,
    } = sessionRunsApiInstance.useClearHistory();

    // Add confirmation dialog state
    const clearHistoryDialog = ref(false);

    const confirmClearHistory = () => {
      clearHistoryDialog.value = true;
    };

    const handleClearHistory = async () => {
      try {
        await clearHistory();
        // Close dialog after successful clear
        clearHistoryDialog.value = false;
      } catch (error) {
        console.error("Failed to clear history:", error);
      }
    };

    const { mutate: deleteSessionRunMutation, isLoading: isDeleting } =
      sessionRunsApiInstance.useDeleteItem();

    const showTerminated = ref(false);
    const searchTerm = ref("");
    const deleteDialog = ref(false);
    const selectedSession = ref(null);

    const columns = [
      {
        name: "runTime",
        label: "Total Run Time",
        field: (row) => calculateRunTime(row.startTime, row.endTime),
        sortable: true,
        align: "left",
      },
      {
        name: "status",
        label: "Status",
        field: "status",
        sortable: true,
        align: "center",
      },
      {
        name: "earnedKamas",
        label: "Earned Net Kamas",
        field: "earnedKamas",
        sortable: true,
        align: "right",
      },
      {
        name: "estimatedKamasWon",
        label: "Daily projection (kamas/d)",
        field: "estimatedKamasWon",
        sortable: true,
        align: "right",
      },
      {
        name: "earnedLevels",
        label: "Earned Levels",
        field: "earnedLevels",
        sortable: true,
        align: "right",
      },
      {
        name: "currentLevel",
        label: "Current Level",
        field: "currentLevel",
        sortable: true,
        align: "right",
      },
      {
        name: "actions",
        label: "Actions",
        field: "id",
        sortable: false,
        align: "center",
      },
    ];

    const pagination = ref({
      sortBy: "startTime",
      descending: false,
      page: 1,
      rowsPerPage: 20,
    });

    return {
      sessionRuns,
      columns,
      pagination,
      isSessionRunsLoading,
      isSessionRunsError,
      sessionRunsError,
      showTerminated,
      searchTerm,
      deleteDialog,
      selectedSession,
      deleteSessionRunMutation,
      isDeleting,
      clearHistory,
      isClearingHistory,
      isClearHistoryError,
      clearHistoryError,
      clearHistoryDialog,
      confirmClearHistory,
      handleClearHistory,
    };
  },

  methods: {
    calculateRunTime(startTime, endTime) {
      if (!startTime) return "N/A";
      if (!endTime) endTime = new Date().toISOString();
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diff = end - start;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    },

    getStatusColor(status) {
      const colors = {
        [SessionStatusEnum.RUNNING]: "positive",
        [SessionStatusEnum.FIGHTING]: "orange",
        [SessionStatusEnum.ROLEPLAYING]: "info",
        [SessionStatusEnum.CRASHED]: "negative",
        [SessionStatusEnum.TERMINATED]: "negative",
        [SessionStatusEnum.DISCONNECTED]: "warning",
        [SessionStatusEnum.AUTHENTICATING]: "grey",
        [SessionStatusEnum.LOADING_MAP]: "blue-grey",
        [SessionStatusEnum.PROCESSING_MAP]: "blue-grey",
        [SessionStatusEnum.OUT_OF_ROLEPLAY]: "purple",
        [SessionStatusEnum.IDLE]: "grey",
        [SessionStatusEnum.BANNED]: "red",
        [SessionStatusEnum.STARTING]: "blue",
        [SessionStatusEnum.DOWN]: "negative",
      };
      return colors[status] || "grey";
    },

    formatNumber(number) {
      if (!number && number !== 0) return "0";
      return number.toLocaleString();
    },

    formatStatus(status) {
      return status?.toLowerCase().replace(/_/g, " ") ?? "";
    },

    calculateEstimatedKamas(row) {
      // Return 0 if we don't have necessary data
      if (!row.startTime) return 0;

      // Calculate total kamas (earned + estimated)
      const totalKamas = (row.earnedKamas || 0) + (row.estimatedKamasWon || 0);

      // Calculate running time in hours
      const runningTime = new Date() - new Date(row.startTime);
      const runningHours = runningTime / (1000 * 60 * 60);

      // Return 0 if session just started
      if (runningHours <= 0) return 0;

      // Calculate hourly rate based on total kamas
      const hourlyRate = totalKamas / runningHours;

      // Project for 24 hours
      return Math.round(hourlyRate * 24);
    },

    confirmDelete(session) {
      this.selectedSession = session;
      this.deleteDialog = true;
    },

    async deleteSessionRun() {
      if (this.selectedSession) {
        try {
          await this.deleteSessionRunMutation(this.selectedSession.id);
          this.selectedSession = null;
          this.deleteDialog = false;
        } catch (error) {
          // Handle any errors if needed
          console.error("Failed to delete session:", error);
        }
      }
    },
  },

  computed: {
    rows() {
      return this.sessionRuns ?? [];
    },

    filteredRows() {
      let filtered = this.rows;

      if (!this.showTerminated) {
        filtered = filtered.filter(
          (row) => row && row.status !== SessionStatusEnum.TERMINATED
        );
      }

      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (row) =>
            row.id.toString().includes(search) ||
            row.status.toLowerCase().includes(search)
        );
      }

      return filtered;
    },
  },
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-table {
  margin-top: 20px;
}

.text-negative {
  color: var(--q-color-negative);
}

:deep(.q-table th) {
  font-weight: bold;
}

:deep(.q-table td) {
  white-space: nowrap;
}

:deep(.text-right) {
  text-align: right !important;
}

:deep(.text-center) {
  text-align: center !important;
}

:deep(.text-left) {
  text-align: left !important;
}
</style>
