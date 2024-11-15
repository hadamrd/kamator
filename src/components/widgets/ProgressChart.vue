<template>
  <div class="chart-container">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      Loading stats...
    </div>
    <div v-else-if="isError" class="error-container">
      <div class="error-message">Error loading data</div>
    </div>
    <div v-else class="stats-dashboard">
      <!-- Chart Controls -->
      <div class="controls-container">
        <div class="toggle-group">
          <label class="toggle-item">
            <input
              type="checkbox"
              v-model="activeDatasets.earnedKamas"
              class="checkbox-input"
            />
            <span class="checkbox-label" style="--color: #42a5f5">
              Earned Kamas
            </span>
          </label>

          <label class="toggle-item">
            <input
              type="checkbox"
              v-model="activeDatasets.estimatedKamas"
              class="checkbox-input"
            />
            <span class="checkbox-label" style="--color: #66bb6a">
              Estimated Kamas
            </span>
          </label>

          <label class="toggle-item">
            <input
              type="checkbox"
              v-model="activeDatasets.fights"
              class="checkbox-input"
            />
            <span class="checkbox-label" style="--color: #ff7043">
              Fights
            </span>
          </label>

          <label class="toggle-item">
            <input
              type="checkbox"
              v-model="activeDatasets.treasureHunts"
              class="checkbox-input"
            />
            <span class="checkbox-label" style="--color: #ab47bc">
              Treasure Hunts
            </span>
          </label>

          <label class="toggle-item">
            <input
              type="checkbox"
              v-model="activeDatasets.kamasPerHour"
              class="checkbox-input"
            />
            <span class="checkbox-label" style="--color: #ffa726">
              Kamas/Hour
            </span>
          </label>
        </div>
      </div>

      <!-- Stats Summary -->
      <div v-if="statsSummary" class="stats-summary">
        <div class="summary-card">
          <div class="card-value">
            {{ formatNumber(statsSummary.totalEarned) }}
          </div>
          <div class="card-label">Total Earned</div>
        </div>
        <div class="summary-card">
          <div class="card-value">
            {{ formatNumber(statsSummary.hourlyRate) }}
          </div>
          <div class="card-label">Kamas/Hour</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ statsSummary.totalFights }}</div>
          <div class="card-label">Fights</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ statsSummary.totalHunts }}</div>
          <div class="card-label">Hunts</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ formatTime(statsSummary.runTime) }}</div>
          <div class="card-label">Run Time</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-wrapper">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { Line } from "vue-chartjs";
import { useWebSocketStore } from "src/stores/webSocketStore";
import sessionRunsApiInstance from "src/api/sessionRuns";
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
  Filler, // Added Filler plugin
} from "chart.js";
import "chartjs-adapter-moment";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
  Filler // Register Filler plugin
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
    const {
      isLoading,
      isError,
      data: sessionRun,
    } = sessionRunsApiInstance.useGetItem(props.sessionRunId);

    // Track active datasets
    const activeDatasets = ref({
      earnedKamas: true,
      estimatedKamas: true,
      fights: false,
      treasureHunts: false,
    });

    const formatNumber = (num) => {
      if (num === undefined || num === null) return "0";
      return num.toLocaleString();
    };

    const formatTime = (milliseconds) => {
      const hours = Math.floor(milliseconds / (1000 * 60 * 60));
      const minutes = Math.floor(
        (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );
      return `${hours}h ${minutes}m`;
    };

    const calculateRunTime = (sessionRun) => {
      if (!sessionRun || !sessionRun.startTime) return 0;
      const startTime = new Date(sessionRun.startTime);
      const endTime = sessionRun.endTime
        ? new Date(sessionRun.endTime)
        : new Date();
      return endTime - startTime;
    };

    // Calculate Kamas per hour for each timestamp
    const calculateKamasPerHour = (stats, sessionRun) => {
      if (!stats || !stats.timestamps.length || !sessionRun) return [];

      const startTime = new Date(sessionRun.startTime);
      return stats.timestamps.map((timestamp, index) => {
        const currentTime = new Date(timestamp);
        const hoursElapsed = (currentTime - startTime) / (1000 * 60 * 60);
        const totalKamas =
          (stats.earnedKamas[index] || 0) +
          (stats.estimatedKamasWon[index] || 0);
        return hoursElapsed > 0 ? Math.round(totalKamas / hoursElapsed) : 0;
      });
    };

    const statsSummary = computed(() => {
      const stats = webSocketStore.getSessionStats(props.sessionRunId);
      if (!stats || !sessionRun.value || stats.timestamps.length === 0)
        return null;

      const lastIndex = stats.timestamps.length - 1;
      const runTime = calculateRunTime(sessionRun.value);
      const runTimeHours = runTime / (1000 * 60 * 60); // Convert to hours for rate calculation
      //
      const totalKamas =
        (stats.earnedKamas[lastIndex] || 0) +
        (stats.estimatedKamasWon[lastIndex] || 0) +
        (stats.kamasSpentOnTaxes || 0);

      return {
        totalEarned: totalKamas,
        hourlyRate: Math.round(totalKamas / runTimeHours),
        totalFights: stats.nbrFightsDone[lastIndex],
        totalHunts: stats.nbrTreasuresHuntsDone[lastIndex],
        runTime: runTime, // Store the raw milliseconds for formatting
      };
    });

    const chartOptions = computed(() => {
      const stats = webSocketStore.getSessionStats(props.sessionRunId);

      let maxKamas = 0;
      let maxCount = 0;
      let maxKamasPerHour = 0;

      if (stats && stats.timestamps.length > 0) {
        if (activeDatasets.value.earnedKamas) {
          maxKamas = Math.max(maxKamas, ...stats.earnedKamas);
        }
        if (activeDatasets.value.estimatedKamas) {
          maxKamas = Math.max(maxKamas, ...stats.estimatedKamasWon);
        }
        if (activeDatasets.value.fights) {
          maxCount = Math.max(maxCount, ...stats.nbrFightsDone);
        }
        if (activeDatasets.value.treasureHunts) {
          maxCount = Math.max(maxCount, ...stats.nbrTreasuresHuntsDone);
        }
        if (activeDatasets.value.kamasPerHour) {
          const kamasPerHour = calculateKamasPerHour(stats, sessionRun.value);
          maxKamasPerHour = Math.max(...kamasPerHour);
        }
      }

      maxKamas = Math.ceil(maxKamas * 1.1);
      maxCount = Math.ceil(maxCount * 1.1);
      maxKamasPerHour = Math.ceil(maxKamasPerHour * 1.1);

      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
              displayFormats: {
                minute: "HH:mm",
              },
            },
            grid: {
              display: false,
            },
          },
          y: {
            display:
              activeDatasets.value.earnedKamas ||
              activeDatasets.value.estimatedKamas,
            beginAtZero: true,
            max: maxKamas || undefined,
            grid: {
              color: "rgba(200, 200, 200, 0.1)",
            },
            ticks: {
              callback: (value) => formatNumber(value),
            },
          },
          y1: {
            display:
              activeDatasets.value.fights || activeDatasets.value.treasureHunts,
            position: "right",
            beginAtZero: true,
            max: maxCount || undefined,
            grid: {
              display: false,
            },
          },
          y2: {
            // New axis for Kamas/hour
            display: activeDatasets.value.kamasPerHour,
            position: "right",
            beginAtZero: true,
            max: maxKamasPerHour || undefined,
            grid: {
              display: false,
            },
            ticks: {
              callback: (value) => `${formatNumber(value)}/h`,
            },
          },
        },
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleColor: "#fff",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                let value = context.raw.y;
                if (context.dataset.yAxisID === "y") {
                  return `${context.dataset.label}: ${formatNumber(
                    value
                  )} kamas`;
                }
                if (context.dataset.yAxisID === "y2") {
                  return `${context.dataset.label}: ${formatNumber(
                    value
                  )} kamas/h`;
                }
                return `${context.dataset.label}: ${value}`;
              },
            },
          },
          legend: {
            display: false,
          },
        },
        animations: {
          tension: {
            duration: 1000,
            easing: "linear",
          },
          y: {
            duration: 1000,
            easing: "easeInOutQuart",
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      };
    });

    const chartData = computed(() => {
      const stats = webSocketStore.getSessionStats(props.sessionRunId);

      if (!stats || !sessionRun.value || stats.timestamps.length === 0) {
        return null;
      }

      const datasets = [];

      if (activeDatasets.value.earnedKamas) {
        datasets.push({
          label: "Earned Kamas",
          data: stats.timestamps.map((timestamp, index) => ({
            x: new Date(timestamp),
            y: stats.earnedKamas[index],
          })),
          borderColor: "#42A5F5",
          backgroundColor: "rgba(66, 165, 245, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: "y",
        });
      }

      if (activeDatasets.value.estimatedKamas) {
        datasets.push({
          label: "Estimated Kamas",
          data: stats.timestamps.map((timestamp, index) => ({
            x: new Date(timestamp),
            y: stats.estimatedKamasWon[index],
          })),
          borderColor: "#66BB6A",
          backgroundColor: "rgba(102, 187, 106, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: "y",
        });
      }

      if (activeDatasets.value.fights) {
        datasets.push({
          label: "Fights",
          data: stats.timestamps.map((timestamp, index) => ({
            x: new Date(timestamp),
            y: stats.nbrFightsDone[index],
          })),
          borderColor: "#FF7043",
          backgroundColor: "rgba(255, 112, 67, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: "y1",
        });
      }

      if (activeDatasets.value.treasureHunts) {
        datasets.push({
          label: "Treasure Hunts",
          data: stats.timestamps.map((timestamp, index) => ({
            x: new Date(timestamp),
            y: stats.nbrTreasuresHuntsDone[index],
          })),
          borderColor: "#AB47BC",
          backgroundColor: "rgba(171, 71, 188, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: "y1",
        });
      }

      if (activeDatasets.value.kamasPerHour) {
        const kamasPerHour = calculateKamasPerHour(stats, sessionRun.value);
        datasets.push({
          label: "Kamas/Hour",
          data: stats.timestamps.map((timestamp, index) => ({
            x: new Date(timestamp),
            y: kamasPerHour[index],
          })),
          borderColor: "#FFA726",
          backgroundColor: "rgba(255, 167, 38, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: "y2",
        });
      }

      return { datasets };
    });

    return {
      chartData,
      chartOptions,
      isLoading,
      isError,
      activeDatasets,
      statsSummary,
      formatNumber,
      formatTime,
    };
  },
};
</script>

<style scoped>
.chart-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stats-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls-container {
  padding: 10px 0;
}

.toggle-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.toggle-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  display: none;
}

.checkbox-label {
  padding: 6px 12px;
  border-radius: 6px;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.checkbox-label::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--color);
}

.checkbox-input:checked + .checkbox-label {
  background: #fff;
  border-color: var(--color);
  color: #000;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #2196f3;
  margin-bottom: 4px;
}

.card-label {
  font-size: 14px;
  color: #666;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 12px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.error-message {
  color: #f44336;
  font-size: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
