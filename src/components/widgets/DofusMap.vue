<template>
  <q-card>
    <q-toolbar
      shrink
      v-if="showTitleBar"
      class="bg-primary glossy dofus-map-title-toolbar"
    >
      <q-toolbar-title class="dofus-map-title-toolbar-title"
        >DofusMap - {{ worldTitle }}</q-toolbar-title
      >
      <q-space />
      <!-- This will push the button to the right -->
      <q-btn
        icon="close"
        flat
        round
        @click="closeDofusMap"
        class="dofus-map-title-toolbar-close-button"
      />
    </q-toolbar>
    <q-toolbar class="dofus-map-menu-toolbar">
      <q-btn-dropdown
        flat
        stretch
        label="Select World"
        class="dofus-map-menu-toolbar-button"
      >
        <q-list>
          <q-item
            v-for="world in store.worlds"
            :key="world.id"
            clickable
            v-close-popup
            @click="map.updateWorld(world.id)"
          >
            <q-item-section>
              <q-item-label>{{ store.i18n(world.nameId) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-separator dark vertical />
      <q-btn
        flat
        stretch
        label="Select Resources"
        @click="toggleResourcePicker"
        class="dofus-map-menu-toolbar-button"
      />
    </q-toolbar>
    <div>
      <div
        ref="mapContainer"
        id="{{ containerId }}"
        class="q-ma-xs mapContainer"
        :style="{ height: mapHeight, width: mapWidth, zIndex: zIndex }"
      ></div>
      <div
        v-if="pathCreatorMode"
        class="selected-maps-section"
        :style="{ width: mapWidth }"
      >
        <q-card flat bordered class="q-ma-md">
          <q-card-section>
            <div>Selected Maps</div>
          </q-card-section>

          <q-separator />

          <q-list bordered dense>
            <q-item v-for="map in selectedMaps" :key="map.id" clickable>
              <q-item-section avatar>
                <q-avatar icon="map" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ map.id }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-btn flat icon="delete" @click="removeMap(map.id)" />
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat label="Save" color="primary" @click="saveMaps" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-card>
  <q-drawer
    v-model="showResourcePicker"
    side="right"
    :width="drawerWidth"
    style="height:'50%"
    overlay
  >
    <ResourcePicker
      :maxSelections="maxResourceSelections"
      @finished="toggleResourcePicker"
      @select="onResourcesSelected"
      :initial-selected-resources="selectedResources"
      confirmButtonLabel="apply"
      cancelButtonLabel="close"
      :closeOnApply="false"
    />
  </q-drawer>
</template>

<!-- eslint-disable no-unused-vars -->
<script>
import { ref } from "vue";
import { useDofusMapStore } from "stores/dofusMapStore";
import ResourcePicker from "./ResourcePicker.vue";
import { DofusWorldMap } from "src/dofusMap/DofusWorldMap.js";
import { useGlobalStore } from "stores/globalVuesStore";

export default {
  name: "DofusMap",
  emits: ["resourcesSelected", "update:modelValue"],
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    zIndex: {
      type: Number,
      default: 1000,
    },
    containerId: {
      type: String,
      default: "mapContainer",
    },
    showTitleBar: {
      type: Boolean,
      default: false,
    },
    height: {
      type: String,
      default: "calc(100svh - 85px)", // Default height as viewport height
    },
    initialSelectedResources: {
      type: Array,
      default: () => [],
    },
    maxResourceSelections: {
      type: Number,
      default: 20,
    },
    drawerWidth: {
      type: Number,
      default: 350,
    },
    asPathCreator: {
      type: Boolean,
      default: false,
    },
    pathCreatorMode: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ResourcePicker,
  },
  setup(props) {
    const store = useDofusMapStore();
    const globalStore = useGlobalStore();
    const validatedResources = Array.isArray(props.initialSelectedResources)
      ? props.initialSelectedResources
      : [];
    const selectedResources = ref([...validatedResources]);
    globalStore.header = "DofusMap";
    var dynamicHeight = ref(props.height);
    if (props.pathCreatorMode) {
      dynamicHeight.value = "calc(100svh - 200px)";
    }
    return {
      store,
      map: ref(null),
      showResourcePicker: ref(true),
      selectedResources,
      globalStore,
      dynamicHeight,
      selectedMaps: ref([]),
    };
  },
  async mounted() {
    this.$nextTick(async () => {
      await this.store.fetchWorldsData();
      await this.store.getWorldDetails(this.store.config.startWorldId);
      this.map = new DofusWorldMap(this.$refs.mapContainer.id, this.store);
      this.map.mapBordersHighlighter.pathCreatorMode = this.pathCreatorMode;
      if (this.showResourcePicker) this.map.resourceLayer.legend.hide();
      this.globalStore.header = "DofusMap - " + this.worldTitle;
      if (this.selectedResources) {
        await this.map.setResourcesMarkers(this.selectedResources);
      }
    });
  },
  computed: {
    worldTitle() {
      return this.store.worldName();
    },
    world() {
      return this.store.world;
    },
    hasParent() {
      return (
        this.world &&
        this.world?.parentId &&
        this.world.parentId != this.world.id
      );
    },
    mapHeight() {
      if (this.pathCreatorMode) {
        return "calc(100svh - 200px)";
      }
      return "calc(100svh - 90px)";
    },
    mapWidth() {
      if (this.showResourcePicker && this.asPathCreator) {
        return `calc(100% - ${this.drawerWidth + "px"})`; // Reduce map width by the drawer width
      }
      return "calc(100% - 7px)"; // Full width when drawer is not visible
    },
  },
  watch: {
    worldTitle(newVal) {
      this.globalStore.header = "DofusMap - " + newVal;
    },
    showResourcePicker(newValue, old) {
      console.log("how resource picked changed from", old, "to", newValue);
      this.$nextTick(() => {
        if (this.map) {
          // Assuming `mapInstance` is your Leaflet or other map library instance
          if (newValue) {
            this.map.resourceLayer.legend.hide();
          } else {
            this.map.resourceLayer.legend.show();
          }
          this.map.invalidateSize(); // Leaflet method to adjust to new container size
        }
      });
    },
  },
  methods: {
    toggleResourcePicker() {
      this.showResourcePicker = !this.showResourcePicker;
    },
    closeResourceSelector() {
      this.showResourcePicker = false;
    },
    async onResourcesSelected(selectedResources) {
      this.selectedResources = selectedResources;
      await this.map.setResourcesMarkers(selectedResources);
    },
    closeDofusMap() {
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
#mapContainer {
  user-select: none;
  /* This will disable text selection for the entire map */
  -webkit-user-select: none;
  /* Safari prefix */
  -moz-user-select: none;
  /* Firefox prefix */
  -ms-user-select: none;
  /* Internet Explorer/Edge prefix */
  /* Ensure the position is set correctly for resizing */
  transition: width 0.3s ease-in-out !important;
  /* Smooth transition for width adjustment */
}

.dofus-map-title-toolbar {
  height: 30px;
  min-height: 20px;
}

.dofus-map-title-toolbar-title {
  font-size: 16px;
}

.dofus-map-title-toolbar-close-button {
  min-width: 20px;
  min-height: 20px;
}

.dofus-map-menu-toolbar {
  height: 30px;
  min-height: 20px;
  margin-right: 0px;
}

.dofus-map-menu-toolbar-button {
  font-size: 11px;
}
</style>
