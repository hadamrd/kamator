<template>
  <q-dialog
    :model-value="modelValue"
    @update:modelValue="handleUpdate"
    persistent
  >
    <div class="q-pa-md q-ma-md">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">Create Dofus Path</div>
        </q-card-section>
        <q-card-section class="q-pa-md q-ma-md">
          <q-form @submit="submitForm">
            <q-input
              dense
              v-model="path.id"
              label="Name"
              class="q-mb-md"
              required
            />
            <q-select
              dense
              outlined
              v-model="path.type"
              :options="pathStore.pathsTypeChoices"
              label="Type"
              class="q-mb-md"
              emit-value
              required
            />
            <div v-if="needStartVertex(path)">
              <q-input
                dense
                v-model="path.startMapId"
                label="Start Map ID"
                class="q-mb-md"
                required
              />
              <q-input
                dense
                v-model="path.startZoneId"
                label="Start Zone ID"
                class="q-mb-md"
                required
              />
            </div>
            <div v-show="needMapSelection(path)">
              <q-chip
                v-for="mapId in path.mapIds"
                :key="mapId"
                removable
                @remove="removeMapFromSelection(mapId)"
              >
                {{ mapId }}
              </q-chip>
              <q-btn
                flat
                dense
                color="primary"
                class="q-mt-md"
                label="Open dofusMap"
                @click="openDofusMap"
              />
            </div>
            <q-card-actions align="center">
              <q-btn
                type="submit"
                flat
                dense
                color="primary"
                class="q-mr-md"
                label="Confirm"
              >
                <q-icon name="check" />
              </q-btn>
              <q-btn
                flat
                dense
                color="negative"
                class="q-ml-md"
                label="Cancel"
                @click="closeWindow"
              >
                <q-icon name="close" />
              </q-btn>
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
  <q-dialog maximized v-model="showDofusMap">
    <DofusMap
      v-model="showDofusMap"
      :pathCreatorMode="true"
      @select="onMapsSelected"
      :showTitleBar="true"
      height="calc(100vh - 100px)"
      :initialSelectedResources="initialSelectedResources"
      :asPathCreator="true"
    />
  </q-dialog>
</template>

<!-- eslint-disable no-unused-vars -->
<script>
import { ref } from "vue";
import { usePathStore } from "src/stores/paths";
import { PathTypeEnum } from "src/enums/sessionEnums";
import DofusMap from "components/widgets/DofusMap.vue";

export default {
  name: "PathForm",
  emits: ["update:modelValue"],
  props: {
    currPathId: {
      type: String,
      default: null,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    DofusMap,
  },
  setup() {
    const initialSelectedResources = [
      {
        name: "Aquajou",
        id: 17991,
        skillName: "Bûcheron",
        skillId: "2",
        dofusMapId: "65",
      },
      {
        name: "Fer",
        id: 312,
        skillName: "Mineur",
        skillId: "24",
        dofusMapId: "68",
      },
      {
        name: "Cuivre",
        id: 441,
        skillName: "Mineur",
        skillId: "24",
        dofusMapId: "67",
      },
    ];
    const pathStore = usePathStore();
    const pathTypes = ref([]);
    const path = ref({
      id: null,
      type: PathTypeEnum.CustomRandomFarmPath,
      startMapId: null,
      startZoneId: null,
      mapIds: [],
      allowedTransitions: [],
      forbiddenSubAreas: [],
    });
    return {
      initialSelectedResources,
      pathTypes,
      pathStore,
      path,
      PathTypeEnum,
      showDofusMap: ref(false),
    };
  },
  async created() {
    await this.pathStore.getPaths();
    await this.pathStore.getPathsTypeChoices();
    if (this.currPathId) {
      var existingPath = this.pathStore.getPathsById(this.currPathId);
      if (existingPath) {
        this.path = existingPath;
      } else {
        console.log(`Path with id ${this.currPathId} not found`);
      }
    }
  },
  methods: {
    onMapsSelected(selectedMapsIds) {
      this.path.mapIds = selectedMapsIds;
    },
    submitForm() {
      console.log("Path Created:", this.path);
      this.pathStore.addPath(this.path);
      this.$emit("update:modelValue", false);
    },
    needStartVertex(path) {
      return (
        path.type == PathTypeEnum.RandomSubAreaFarmPath ||
        path.type == PathTypeEnum.RandomAreaFarmPath
      );
    },
    needMapSelection(path) {
      return path.type == PathTypeEnum.CustomRandomFarmPath;
    },
    removeMapFromSelection(mapId) {
      this.path.mapIds = this.path.mapIds.filter((id) => id !== mapId);
    },
    closeWindow() {
      this.path = {
        id: null,
        type: null,
        startMapId: null,
        startZoneId: null,
        mapIds: [],
        allowedTransitions: [],
        forbiddenSubAreas: [],
      };
      this.$emit("update:modelValue", false);
    },
    closeDofusMap() {
      this.showDofusMap = false;
    },
    openDofusMap() {
      this.showDofusMap = true;
    },
    handleUpdate(value) {
      this.$emit("update:modelValue", value);
    },
  },
};
</script>

<style scoped></style>
