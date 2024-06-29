<template>
  <div>
      <q-card class="q-pa-md">
          <q-card-section>
              <div style="display: flex; justify-content: space-between;">
                  <div class="text-h6">Sessions running</div>
                  <q-btn color="negative" label="Clear History" icon="delete" @click="sessionRunStore.clearHistory()"
                      class="q-mb-md" />
              </div>
          </q-card-section>

          <q-card-section>
              <q-table :rows="filteredRows" :columns="columns" row-key="id" :loading="loading" binary-state-sort v-model:pagination="pagination">
                  <template v-slot:body-cell-details="props">
                      <q-td :props="props">
                          <q-btn flat dense @click="navigateToDetails(props.row.id)" icon="launch" />
                      </q-td>
                  </template>
              </q-table>
          </q-card-section>
      </q-card>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useSessionRunStore } from 'stores/sessionRuns';
import { SessionStatusEnum } from 'src/enums/sessionEnums';


function calculateRunTime(startTime, endTime) {
  if (!startTime) return 'N/A';
  if (!endTime)
      endTime = new Date().toISOString();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end - start;
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}
export default {
  name: 'SessionRunList',
  emits: ['select-session'],
  setup() {
      const sessionRunStore = useSessionRunStore();
      const columns = [
          {
              name: 'runTime',
              label: 'Total Run Time',
              field: row => calculateRunTime(row.startTime, row.endTime),
              sortable: true
          },
          {
              name: "status",
              label: "Status",
              field: "status",
              format: (val) => (val.length > 10 ? val.slice(0, 25) + "..." : val),
              style: "max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
              sortable: true,
          },
          {
              name: "earnedKamas",
              label: 'earnedKamas',
              field: "earnedKamas"
          },
          {
              name: "nbrFightsDone",
              label: 'nbrFightsDone',
              field: "nbrFightsDone"
          },
          {
              name: "nbrOfDeaths",
              label: 'nbrOfDeaths',
              field: "nbrOfDeaths"
          },
          {
              name: 'estimatedKamasWon',
              label: 'estimatedKamasWon',
              field: 'estimatedKamasWon',
              sortable: true
          },
          {
              name: 'earnedLevels',
              label: 'earnedLevels',
              field: 'earnedLevels',
              sortable: true
          },
          {
              name: 'currentLevel',
              label: 'currentLevel',
              field: 'currentLevel',
              sortable: true
          },
          {
              name: 'details',
              label: 'Details',
              field: 'id',
              sortable: false,
              format: (val) => '',
              style: 'width: 150px',
              classes: 'text-right',
              headerClasses: 'text-right',
              body: (props) => {
                  return `<q-btn flat label="View Details" @click="navigateToDetails('${props.row.id}')" icon="launch" />`
              }
          }
      ];
      const pagination = ref({
          sortBy: 'startTime',
          descending: false,
          page: 1,
          rowsPerPage: 20
      });

      const loading = ref(false);

      return { sessionRunStore, columns, pagination, loading };
  },
  async created() {
      try {
          await this.sessionRunStore.getSessionsRuns();
      } catch (error) {
          console.error(error);
      }
  },
  methods: {
      formatDateTime(dateTime) {
          const date = new Date(dateTime);
          return date.toLocaleString();
      },
      calculateRunTime(start, end) {
          if (!start || !end) return 'N/A';
          let startDate = new Date(start);
          let endDate = new Date(end);
          let diff = endDate - startDate;
          return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
      },
      navigateToDetails(sessionRunId) {
          this.$router.push({ name: 'SessionDetails', params: { id: sessionRunId } });
      }
  },
  computed: {
      rows() {
          if (this.sessionRunStore.sessions_runs === null)
              return [];
          return this.sessionRunStore.sessions_runs;
      },
      filteredRows() {
          return this.rows.filter(row => row.status != SessionStatusEnum.TERMINATED);
      }
  }
};
</script>

<style scoped>
.float-right {
  float: right;
}
</style>
