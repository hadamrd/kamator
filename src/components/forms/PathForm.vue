<template>
  <q-dialog
    :model-value="modelValue"
    @update:modelValue="handleUpdate"
    persistent
  >
    <div class="q-pa-md q-ma-md">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">{{ isEditMode ? 'Edit' : 'Create' }} Dofus Path</div>
        </q-card-section>
        <q-inner-loading :showing="isEditMode && isPathLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <q-card-section class="q-pa-md q-ma-md" :class="{ 'blur-content': isEditMode && isPathLoading }">
          <q-form @submit="onSubmit">
            <q-input
              dense
              v-model="id"
              label="Name"
              class="q-mb-md"
              v-bind="idAttrs"
              :disable="isEditMode"
            />
            <q-select
              dense
              outlined
              v-model="type"
              :options="pathTypesOptions"
              label="Type"
              class="q-mb-md"
              emit-value
              v-bind="typeAttrs"
            />
            <div v-if="needStartVertex">
              <q-input
                dense
                v-model="startMapId"
                label="Start Map ID"
                class="q-mb-md"
                v-bind="startMapIdAttrs"
              />
              <q-input
                dense
                v-model="startZoneId"
                label="Start Zone ID"
                class="q-mb-md"
                v-bind="startZoneIdAttrs"
              />
            </div>
            <div v-if="needMapSelection">
              <q-chip
                v-for="mapId in mapIds"
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
                :label="isEditMode ? 'Update' : 'Create'"
                :loading="isSubmitting"
              >
                <q-icon :name="isEditMode ? 'update' : 'add'" />
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

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import pathsApiInstance from "src/api/paths";
import { PathTypeEnum } from "src/enums/sessionEnums";
import DofusMap from "components/widgets/DofusMap.vue";

const emit = defineEmits(["update:modelValue"]);

const props = defineProps({
  currPathId: {
    type: String,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const isEditMode = computed(() => !!props.currPathId);

// Fetch data using API instances
const { data: pathTypes, isLoading: isPathTypesLoading } = pathsApiInstance.useGetPathsTypeChoices();

const {
  data: currentPath,
  isLoading: isPathLoading,
  error: pathError
} = isEditMode.value
  ? pathsApiInstance.useGetItem(props.currPathId)
  : { data: ref(null), isLoading: ref(false), error: ref(null) };

const { mutate: addPath, isLoading: isAddSubmitting } = pathsApiInstance.useAddItem();
const { mutate: updatePath, isLoading: isUpdateSubmitting } = pathsApiInstance.useUpdateItem();

const isSubmitting = computed(() => isAddSubmitting || isUpdateSubmitting);

// Form validation schema
const validationSchema = yup.object({
  id: yup.string().required("Name is required"),
  type: yup.string().required("Type is required"),
  startMapId: yup.number().when('type', {
    is: (val) => val === PathTypeEnum.RandomSubAreaFarmPath || val === PathTypeEnum.RandomAreaFarmPath,
    then: () => yup.number().required("Start Map ID is required"),
    otherwise: () => yup.number().nullable()
  }),
  startZoneId: yup.number().when('type', {
    is: (val) => val === PathTypeEnum.RandomSubAreaFarmPath || val === PathTypeEnum.RandomAreaFarmPath,
    then: () => yup.number().required("Start Zone ID is required"),
    otherwise: () => yup.number().nullable()
  }),
  mapIds: yup.array().when('type', {
    is: PathTypeEnum.CustomRandomFarmPath,
    then: () => yup.array().min(1, "At least one map must be selected"),
    otherwise: () => yup.array()
  }),
});

// Use the form with initial values and the validation schema
const { handleSubmit, errors, resetForm, defineField } = useForm({
  validationSchema,
  initialValues: {
    id: null,
    type: PathTypeEnum.CustomRandomFarmPath,
    startMapId: null,
    startZoneId: null,
    mapIds: [],
    allowedTransitions: [],
    forbiddenSubAreas: [],
  },
});

// Define fields with VeeValidate and Quasar configuration
const quasarConfig = (state) => ({
  props: {
    error: !!state.errors[0],
    "error-message": state.errors[0],
  },
});

const [id, idAttrs] = defineField("id", quasarConfig);
const [type, typeAttrs] = defineField("type", quasarConfig);
const [startMapId, startMapIdAttrs] = defineField("startMapId", quasarConfig);
const [startZoneId, startZoneIdAttrs] = defineField("startZoneId", quasarConfig);
const [mapIds, mapIdsAttrs] = defineField("mapIds", quasarConfig);

const showDofusMap = ref(false);

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

const pathTypesOptions = computed(() => {
  if (isPathTypesLoading.value) {
    return []; // Return an empty array while loading
  }
  return pathTypes?.value || []; // Use optional chaining
});

const needStartVertex = computed(() =>
  type.value === PathTypeEnum.RandomSubAreaFarmPath || type.value === PathTypeEnum.RandomAreaFarmPath
);

const needMapSelection = computed(() => type.value === PathTypeEnum.CustomRandomFarmPath);

const onSubmit = handleSubmit(async (values) => {
  try {
    const path = {
      ...values,
      allowedTransitions: [],
      forbiddenSubAreas: [],
    };

    if (isEditMode.value) {
      await updatePath({ id: props.currPathId, newItem: path });
    } else {
      await addPath(path);
    }
    closeWindow();
  } catch (error) {
    console.error("Error submitting form:", error);
    // Handle the error, maybe show it to the user
  }
});

const removeMapFromSelection = (mapIdToRemove) => {
  mapIds.value = mapIds.value.filter((id) => id !== mapIdToRemove);
};

const closeWindow = () => {
  resetForm();
  emit("update:modelValue", false);
};

const openDofusMap = () => {
  showDofusMap.value = true;
};

const handleUpdate = (value) => {
  emit("update:modelValue", value);
};

const onMapsSelected = (selectedMapsIds) => {
  mapIds.value = selectedMapsIds;
};

// Watch for changes in the current path when in edit mode
watch(currentPath, (newPath) => {
  if (newPath && isEditMode.value) {
    resetForm({
      values: {
        id: newPath.id,
        type: newPath.type,
        startMapId: newPath.startMapId,
        startZoneId: newPath.startZoneId,
        mapIds: newPath.mapIds,
        allowedTransitions: newPath.allowedTransitions,
        forbiddenSubAreas: newPath.forbiddenSubAreas,
      },
    });
  }
}, { immediate: true });

// Error handling for path loading
watch(pathError, (error) => {
  if (error && isEditMode.value) {
    console.error("Error loading path:", error);
    // You might want to show an error message to the user here
  }
});

onMounted(() => {
  if (!isEditMode.value) {
    resetForm();
  }
});
</script>

<style scoped>
.blur-content {
  filter: blur(2px);
  pointer-events: none;
}
</style>
