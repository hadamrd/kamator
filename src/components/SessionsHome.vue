<template>
  <q-card class="q-pa-md">
    <q-card-section>
      <q-btn label="New Session" color="primary" @click="toggleMenu">
        <q-menu v-model="menuOpen">
          <q-list style="min-width: 100px">
            <q-item
              v-for="option in sessionTypesChoices"
              :key="option.value"
              clickable
              @click="selectSessionType(option.value)"
            >
              <q-item-section>{{ option?.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-card-section>
    <q-card-section>
      <SessionList />
    </q-card-section>
  </q-card>
  <component
    :is="currentFormComponent"
    v-model="showSessionForm"
    :key="selectedSessionType"
    @finished="resetForm"
  />
</template>

<script>
import { ref } from "vue";
import SessionList from "./SessionList.vue";
import SoloFightSessionForm from "./forms/SoloFightSessionForm.vue";
import TreasureHuntSessionForm from "./forms/TreasureHuntSessionForm.vue";
import FarmSessionForm from "./forms/FarmSessionForm.vue";
import GroupFightSessionForm from "./forms/GroupFightSessionForm.vue";
import MuleFightSessionForm from "./forms/MuleFightSessionForm.vue";
import { useGlobalStore } from "stores/globalVuesStore";
import { SessionTypeEnum, sessionTypesChoices } from "src/enums/sessionEnums";

export default {
  name: "SessionsView",
  components: {
    SessionList,
    SoloFightSessionForm,
    TreasureHuntSessionForm,
    FarmSessionForm,
    GroupFightSessionForm,
    MuleFightSessionForm,
  },
  setup() {
    const showSessionForm = ref(false);
    const selectedSessionType = ref(null);
    const globalStore = useGlobalStore();
    globalStore.header = "Sessions";
    const menuOpen = ref(false);
    return {
      showSessionForm,
      selectedSessionType,
      menuOpen,
      sessionTypesChoices,
    };
  },
  computed: {
    currentFormComponent() {
      return this.getSessionTypeForm(this.selectedSessionType);
    },
  },
  methods: {
    getSessionTypeForm(sessionType) {
      switch (sessionType) {
        case SessionTypeEnum.SOLO_FIGHT:
          return "SoloFightSessionForm";
        case SessionTypeEnum.TREASURE_HUNT:
          return "TreasureHuntSessionForm";
        case SessionTypeEnum.FARM:
          return "FarmSessionForm";
        case SessionTypeEnum.GROUP_FIGHT:
          return "GroupFightSessionForm";
        case SessionTypeEnum.MULE_FIGHT:
          return "MuleFightSessionForm";
        default:
          return null;
      }
    },
    toggleMenu() {
      this.menuOpen = !!this.menuOpen;
    },
    selectSessionType(type) {
      this.menuOpen = false; // Close the menu after selection
      this.selectedSessionType = type;
      this.showSessionForm = true; // Show the form
    },
    resetForm() {
      this.selectedSessionType = null; // Reset form type on finish
    },
  },
};
</script>
