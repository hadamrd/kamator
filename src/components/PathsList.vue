<template>
  <q-card class="q-pa-md q-gutter-md">
    <q-btn
      flat
      dense
      color="primary"
      :disable="loading"
      label="Add path"
      @click="openPathForm"
    />
    <q-list bordered>
      <q-item v-for="path in store.paths" :key="path.id" clickable v-ripple>
        <q-item-section>
          <q-item-label lines="1">{{ path.id }}</q-item-label>
          <q-item-label caption>{{ path.type }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-grey-8 q-gutter-xs">
            <q-btn
              class="gt-xs"
              dense
              round
              flat
              color="grey"
              @click="askConfirmDelete(path.id)"
              icon="delete"
            >
              <q-tooltip :offset="[11, 0]">Delete path</q-tooltip>
            </q-btn>
            <q-btn class="gt-xs" dense round flat color="grey" icon="more_vert">
              <q-tooltip :offset="[10, 0]">More actions</q-tooltip>
              <q-menu touch-position auto-close>
                <q-list dense>
                  <q-item clickable></q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
  <PathForm v-model="showPathForm" :currPathId="selected.id" />
  <q-dialog v-model="confirmDelete" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="delete" color="primary" text-color="white" />
        <span class="q-ml-sm"
          >Are you sure ?. This will delete the path definitely!</span
        >
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Yes"
          color="primary"
          @click="deletePath"
          v-close-popup
        />
        <q-btn
          flat
          label="Cancel"
          color="primary"
          @click="confirmDelete"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { usePathStore } from "stores/paths";
import { ref } from "vue";
import PathForm from "./forms/PathForm.vue";
import { useGlobalStore } from "stores/globalVuesStore";

export default {
  name: "PathsListVue",
  components: {
    PathForm,
  },
  setup() {
    const store = usePathStore();
    const { paths } = store;
    const globalStore = useGlobalStore();
    globalStore.header = "Paths";
    return {
      paths,
      showPathForm: ref(false),
      store,
      confirmDelete: ref(false),
      selected: ref({ id: null }),
      loading: ref(false),
    };
  },
  async created() {
    await this.store.getPaths();
    await this.store.getPathsTypeChoices();
  },
  computed: {},
  methods: {
    askConfirmDelete(pathId) {
      this.confirmDelete = true;
      this.selected = { id: pathId };
    },
    deletePath() {
      this.confirmDelete = false;
      this.store.deletePath(this.selected.id);
      this.selected = { id: null };
    },
    closePathForm() {
      this.showPathForm = false;
    },
    openPathForm() {
      console.log("openPathForm");
      this.showPathForm = true;
    },
    confirmDeletePath() {
      this.confirmDelete = false;
      this.selected = null;
    },
  },
};
</script>
