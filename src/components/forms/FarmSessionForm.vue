<template>
  <q-dialog persistent>
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">{{ isEditMode ? 'Edit' : 'Create' }} Farm</div>
        </q-card-section>
        <q-inner-loading :showing="isEditMode && isASessionLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <q-card-section class="q-pa-md q-ma-md" :class="{ 'blur-content': isEditMode && isASessionLoading }">
          <q-input
            dense
            v-model="id"
            label="Session Name"
            class="q-mb-md"
            v-bind="idAttrs"
            :disable="isEditMode"
          />
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="character"
            v-bind="characterAttrs"
            use-input
            :options="characterSelectOptions"
            @filter="filterCharacters"
            label="Main character"
            option-label="name"
            :loading="isCharactersLoading"
          >
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                @click.stop.prevent="character = null"
                :disable="!character"
              />
            </template>
          </q-select>
          <q-input
            type="number"
            step="1"
            dense
            v-model.number="numberOfCovers"
            label="Number of covers per path"
            class="q-mb-md"
            v-bind="numberOfCoversAttrs"
          />
          <q-select
            dense
            class="q-mb-md"
            outlined
            bottom-slots
            v-model="pathsList"
            v-bind="pathsListAttrs"
            use-input
            multiple
            emit-value
            input-debounce="0"
            label="Select paths"
            option-label="id"
            :options="paths"
            @filter="filterPaths"
            :loading="isPathsLoading"
          >
            <template v-slot:selected-item="{ opt }">
              <q-chip
                dense
                class="q-mr-xs"
                removable
                @remove="removePathOption(opt)"
              >{{ opt.id }}</q-chip>
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                @click.stop.prevent="pathsList = []"
                :disable="pathsList.length < 1"
              />
            </template>
          </q-select>
          <JobResourceSelector
            :initial-filters="jobFilters"
            @update-job-filter="handleJobFiltersData"
          />
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="unloadType"
            v-bind="unloadTypeAttrs"
            :options="sessionUnloadTypeChoices"
            label="Select unload Type"
            option-label="label"
            option-value="value"
          />
          <q-select
            dense
            outlined
            bottom-slots
            v-model="seller"
            v-bind="sellerAttrs"
            :options="sellerSelectOptions"
            @filter="filterSellers"
            use-input
            label="Seller"
            option-label="name"
            v-show="unloadType === UnloadTypeEnum.SELLER"
          >
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                @click.stop.prevent="seller = null"
                :disable="!seller"
              />
            </template>
            <template v-slot:hint>Character that will collect bots resources.</template>
          </q-select>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            flat
            dense
            color="primary"
            class="q-mr-md"
            :label="isEditMode ? 'Update' : 'Create'"
            @click="onSubmit"
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
            @click="closeModal"
          >
            <q-icon name="close" />
          </q-btn>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";
import { SessionTypeEnum, UnloadTypeEnum } from "src/enums/sessionEnums";
import JobResourceSelector from "components/widgets/JobResourceSelector.vue";
import sessionsApiInstance from "src/api/session";
import pathsApiInstance from "src/api/paths";
import charactersApiInstance from "src/api/characters";

const emit = defineEmits(["update:modelValue", "finished"]);

const props = defineProps({
  currSessionId: {
    type: String,
    default: null,
  },
});

const isEditMode = computed(() => !!props.currSessionId);

// Fetch data using API instances
const { data: characters, isLoading: isCharactersLoading } = charactersApiInstance.useGetItems();
const { data: paths, isLoading: isPathsLoading } = pathsApiInstance.useGetItems();

// Only fetch session data if we're in edit mode
const {
  data: aSession,
  isLoading: isASessionLoading,
  error: aSessionError
} = isEditMode.value
  ? sessionsApiInstance.useGetItem(props.currSessionId)
  : { data: ref(null), isLoading: ref(false), error: ref(null) };

const { mutate: addSession, isLoading: isAddSubmitting } = sessionsApiInstance.useAddItem();
const { mutate: updateSession, isLoading: isUpdateSubmitting } = sessionsApiInstance.useUpdateItem();

const isSubmitting = computed(() => isAddSubmitting || isUpdateSubmitting);

// Define form validation schema using Yup
const validationSchema = yup.object({
  id: yup
    .string()
    .required("Session ID is required")
    .min(3, "Session ID must be at least 3 characters")
    .max(50, "Session ID must be less than 50 characters")
    .matches(/^[a-zA-Z0-9_-]*$/, "Session ID can only contain alphanumeric characters, dashes and underscores"),
  character: yup.object().nullable().required("Character is required"),
  numberOfCovers: yup
    .number()
    .required("Number of covers is required")
    .min(1, "Minimum value is 1"),
  pathsList: yup.array().min(1, "At least one path must be selected"),
  unloadType: yup.string().required("Unload Type is required"),
  seller: yup
    .object()
    .nullable()
    .when("unloadType", {
      is: UnloadTypeEnum.SELLER,
      then: yup
        .object()
        .required("Seller is required when unloading to seller")
        .test(
          "different-account",
          "Seller must belong to a different account than the character",
          function (value) {
            const { character } = this.parent;
            if (character && value) {
              return character.account !== value.account;
            }
            return true;
          }
        )
        .test(
          "same-server",
          "Seller must be on the same server as the character",
          function (value) {
            const { character } = this.parent;
            if (character && value) {
              return character.serverName === value.serverName;
            }
            return true;
          }
        ),
    }),
});

// Quasar configuration for handling field errors
const quasarConfig = (state) => ({
  props: {
    error: !!state.errors[0],
    "error-message": state.errors[0],
  },
});

// Use the form with initial values and the validation schema
const { handleSubmit, errors, resetForm, defineField } = useForm({
  validationSchema,
  initialValues: {
    id: uuidv4(),
    character: null,
    numberOfCovers: 3,
    pathsList: [],
    unloadType: UnloadTypeEnum.BANK,
    seller: null,
  },
});

// Define fields with VeeValidate and Quasar configuration
const [id, idAttrs] = defineField("id", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [numberOfCovers, numberOfCoversAttrs] = defineField("numberOfCovers", quasarConfig);
const [pathsList, pathsListAttrs] = defineField("pathsList", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);

const jobFilters = ref([]);

// Submit handler for the form
const onSubmit = handleSubmit(async (values) => {
  try {
    const session = {
      ...values,
      character: values.character?.id,
      seller: values.seller?.id,
      jobFilters: jobFilters.value,
      type: values.pathsList.length > 1 ? SessionTypeEnum.MULTIPLE_PATHS_FARM : SessionTypeEnum.FARM,
    };

    if (session.type === SessionTypeEnum.FARM) {
      session.path = session.pathsList[0].id;
      delete session.pathsList;
    } else {
      session.pathsList = session.pathsList.map(p => p.id);
    }

    if (isEditMode.value) {
      await updateSession({ id: props.currSessionId, newItem: session });
    } else {
      await addSession(session);
    }
    closeModal();
  } catch (error) {
    console.error("Error submitting form:", error);
  }
});

// Character and seller selection logic
const characterSelectOptions = computed(() => {
  if (!characters.value || !seller.value) {
    return characters.value || [];
  }

  return characters.value.filter((ch) => {
    return (ch.account !== seller.value?.account);
  });
});

const sellerSelectOptions = computed(() => {
  if (!characters.value || !character.value) {
    return characters.value || [];
  }

  return characters.value.filter((ch) => {
    return (
      ch.serverName === character.value.serverName &&
      ch.account !== character.value.account
    );
  });
});

// Watchers for handling character and seller changes
watch(character, (newval, oldval) => {
  if (!newval) {
    character.value = null;
    return;
  }
  if (
    seller.value &&
    (newval.serverName !== seller.value.serverName ||
      newval.account === seller.value.account)
  ) {
    seller.value = null;
  }
});

watch(seller, (newSeller, oldSeller) => {
  if (!newSeller) {
    seller.value = null;
    return;
  }
  if (
    character.value &&
    newSeller.account === character.value.account &&
    newSeller.serverName === character.value.serverName
  ) {
    character.value = null;
  }
});

watch(unloadType, (newVal) => {
  if (newVal === UnloadTypeEnum.BANK) {
    seller.value = null;
  }
});

// Methods for filter and clearing inputs
const filterCharacters = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    characterSelectOptions.value = characters.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const filterPaths = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    paths.value = paths.value.filter(v => v.id.toLowerCase().indexOf(needle) > -1);
  });
};

const filterSellers = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    sellerSelectOptions.value = sellerSelectOptions.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const removePathOption = (option) => {
  pathsList.value = pathsList.value.filter((o) => o.id !== option.id);
};

const handleJobFiltersData = (filters) => {
  jobFilters.value = filters;
};

// Close modal method
const closeModal = () => {
  emit("update:modelValue", false);
  emit("finished");
};

// Session unload type choices
const sessionUnloadTypeChoices = [
  { label: "Bank", value: UnloadTypeEnum.BANK },
  { label: "Seller", value: UnloadTypeEnum.SELLER },
];

// Lifecycle hook to set initial values if editing an existing session
watch(aSession, (newSession) => {
  if (newSession && isEditMode.value) {
    resetForm({
      values: {
        id: newSession.id,
        character: newSession.character,
        numberOfCovers: newSession.numberOfCovers,
        unloadType: newSession.unloadType,
        seller: newSession.seller,
        pathsList: newSession.type === SessionTypeEnum.MULTIPLE_PATHS_FARM ? newSession.pathsList : [newSession.path],
      },
    });
    jobFilters.value = newSession.jobFilters || [];
  }
}, { immediate: true });

/// Error handling for session loading
watch(aSessionError, (error) => {
  if (error && isEditMode.value) {
    console.error("Error loading session:", error);
    // You might want to show an error message to the user here
  }
});

onMounted(() => {
  if (!isEditMode.value) {
    resetForm({
      values: {
        id: uuidv4(),
        character: null,
        numberOfCovers: 3,
        pathsList: [],
        unloadType: UnloadTypeEnum.BANK,
        seller: null,
      }
    });
    jobFilters.value = [];
  }
});

</script>

<style scoped>
.min-width-800px {
  max-width: none !important;
  min-width: 800px;
}
.blur-content {
  filter: blur(2px);
  pointer-events: none;
}
</style>
