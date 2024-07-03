<template>
  <div>
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="header">
          <div class="text-h6">Sessions Running</div>
          <q-btn
            color="negative"
            label="Clear History"
            icon="delete"
            @click="sessionRunStore.clearHistory()"
            class="q-ml-md"
          />
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
        >
          <template v-slot:body-cell-details="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                :to="{name: 'SessionRunDetails', params: { sessionRunId: props.row.id, sessionId: props.row.session}}"
                icon="launch"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <q-card-section v-if="isSessionRunsLoading">
        <q-spinner color="primary" />
      </q-card-section>

      <q-card-section v-if="isSessionRunsError">
        <div class="text-negative">
          Error loading session runs: {{ sessionRunsError.message }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import sessionRunsApiInstance from 'src/api/sessionRuns';
import { SessionStatusEnum } from 'src/enums/sessionEnums';

function calculateRunTime(startTime, endTime) {
  if (!startTime) return 'N/A';
  if (!endTime) endTime = new Date().toISOString();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end - start;
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

export default {
  name: 'SessionRunList',
  emits: ['select-session'],
  setup() {
    const {
      isLoading: isSessionRunsLoading,
      data: sessionRuns,
      isError: isSessionRunsError,
      error: sessionRunsError,
      refetch: refetchSessionRuns,
    } = sessionRunsApiInstance.useGetItems();

    const columns = [
      {
        name: 'runTime',
        label: 'Total Run Time',
        field: row => calculateRunTime(row.startTime, row.endTime),
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        format: val => (val.length > 10 ? val.slice(0, 30) + '...' : val),
        style: 'max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
        sortable: true,
      },
      {
        name: 'earnedKamas',
        label: 'Earned Kamas',
        field: 'earnedKamas',
        sortable: true,
      },
      {
        name: 'estimatedKamasWon',
        label: 'Estimated Kamas Won',
        field: 'estimatedKamasWon',
        sortable: true,
      },
      {
        name: 'earnedLevels',
        label: 'Earned Levels',
        field: 'earnedLevels',
        sortable: true,
      },
      {
        name: 'currentLevel',
        label: 'Current Level',
        field: 'currentLevel',
        sortable: true,
      },
      {
        name: 'details',
        label: 'Details',
        field: 'id',
        sortable: false,
        format: () => '',
        style: 'width: 150px',
        classes: 'text-right',
        headerClasses: 'text-right',
        body: props => {
          return `<q-btn
                flat
                dense
                :to="{name: 'SessionRunDetails', params: { sessionRunId: ${props.row.id}, sessionId: ${props.row.session} }}"
                icon="launch"
              />`;
        },
      },
    ];

    const pagination = ref({
      sortBy: 'startTime',
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
    };
  },
  methods: {
  },
  computed: {
    rows() {
      return this.sessionRuns ?? [];
    },
    filteredRows() {
      return this.rows.filter(row => row && row.status !== SessionStatusEnum.TERMINATED);
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
</style>
