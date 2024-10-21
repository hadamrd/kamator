<template>
  <div>
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { useWebSocketStore } from 'src/stores/webSocketStore';
import sessionRunsApiInstance from 'src/api/sessionRuns';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-moment';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
);

export default {
  components: {
    // eslint-disable-next-line vue/no-reserved-component-names
    Line,
  },
  props: {
    sessionRunId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const webSocketStore = useWebSocketStore();

    const { isLoading, isError, data: sessionRun } = sessionRunsApiInstance.useGetItem(props.sessionRunId);

    const chartOptions = {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
          },
        },
      },
    };

    const chartData = computed(() => {
      const statsHistory = webSocketStore.statsHistory[props.sessionRunId] || null;

      if (!statsHistory || !sessionRun) {
        return {
          labels: [],
          datasets: [
            { label: 'Earned Kamas', data: [], borderColor: '#42A5F5', fill: false, lineTension: 0.1 }
          ],
        };
      }

      return {
        labels: statsHistory.timestamps,
        datasets: [
          {
            label: 'Earned Kamas',
            data: statsHistory.earnedKamas,
            borderColor: '#42A5F5',
            fill: false,
            lineTension: 0.1,
          }
        ],
      };
    });

    return {
      chartData,
      chartOptions,
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
