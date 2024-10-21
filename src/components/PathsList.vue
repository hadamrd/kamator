<template>
  <q-page>
    <q-card class="q-pa-md q-gutter-md">
      <div v-if="isPathsLoading" class="flex flex-center q-my-md">
        <q-spinner color="primary" size="40px" />
      </div>
      <div v-else-if="isPathsError" class="q-my-md">
        <q-banner inline-actions dense class="bg-red-2 text-red-10">
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <span>Error loading paths: {{ pathsError.message }}</span>
          <q-btn flat label="Retry" color="primary" @click="refetchPaths" />
        </q-banner>
      </div>
      <div v-else>
        <q-btn
          flat
          dense
          color="primary"
          :disable="loading"
          label="Add path"
          @click="openPathForm"
        />
        <q-list bordered>
          <q-item v-for="path in paths" :key="path.id" clickable v-ripple>
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
                <q-btn
                  class="gt-xs"
                  dense
                  round
                  flat
                  color="grey"
                  icon="more_vert"
                >
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
      </div>
    </q-card>
    <PathForm v-model="showPathForm" :currPathId="selected.id" />
    <q-dialog v-model="confirmDelete" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="primary" text-color="white" />
          <span class="q-ml-sm"
            >Are you sure? This will delete the path permanently!</span
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
          <q-btn flat label="Cancel" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from "vue";
import PathForm from "./forms/PathForm.vue";
import { useGlobalStore } from "stores/globalVuesStore";
import pathsApiInstance from "src/api/paths";

export default {
  name: "PathsListVue",
  components: {
    PathForm,
  },
  setup() {
    const globalStore = useGlobalStore();
    globalStore.header = "Paths";

    const {
      isLoading: isPathsLoading,
      data: paths,
      isError: isPathsError,
      error: pathsError,
      refetch: refetchPaths,
    } = pathsApiInstance.useGetItems();

    const showPathForm = ref(false);
    const confirmDelete = ref(false);
    const selected = ref({ id: null });
    const loading = ref(false);

    const askConfirmDelete = (pathId) => {
      confirmDelete.value = true;
      selected.value = { id: pathId };
    };

    const deletePath = async () => {
      loading.value = true;
      try {
        await pathsApiInstance.deleteItem(selected.value.id);
        refetchPaths();
      } catch (error) {
        console.error("Failed to delete path:", error);
      } finally {
        loading.value = false;
        confirmDelete.value = false;
        selected.value = { id: null };
      }
    };

    const openPathForm = () => {
      showPathForm.value = true;
    };

    return {
      paths,
      isPathsLoading,
      isPathsError,
      pathsError,
      refetchPaths,
      showPathForm,
      confirmDelete,
      selected,
      loading,
      askConfirmDelete,
      deletePath,
      openPathForm,
    };
  },
};
</script>
