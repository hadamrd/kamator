<template>
  <q-dialog persistent @hide="onDialogHide">
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <!-- Header -->
        <q-card-section class="bg-primary text-white">
          <div class="row items-center">
            <div class="text-h6 col">
              {{ isEditMode ? "Edit" : "Create" }} Solo Fight
            </div>
            <q-btn
              v-if="isDirty"
              dense
              flat
              round
              icon="restore"
              @click="resetForm"
            >
              <q-tooltip>Reset Changes</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <!-- Loading State -->
        <q-inner-loading :showing="isEditMode && isASessionLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>

        <!-- Form Content -->
        <q-card-section
          class="q-pa-md q-ma-md scroll-container"
          :class="{ 'blur-content': isEditMode && isASessionLoading }"
        >
          <!-- Session Name -->
          <div class="form-group">
            <q-input
              dense
              v-model="name"
              label="Session Name"
              class="q-mb-md"
              v-bind="nameAttrs"
              :disable="isEditMode"
              @keydown.enter="focusNext"
            >
              <template v-slot:append>
                <q-icon
                  v-if="!isEditMode"
                  name="auto_fix_high"
                  class="cursor-pointer"
                  @click="generateRandomName"
                >
                  <q-tooltip>Generate Random Name</q-tooltip>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Combat Settings -->
          <div class="form-group">
            <div class="text-subtitle2 q-mb-sm">Combat Settings</div>
            <q-input
              type="number"
              dense
              v-model.number="monsterLvlCoefDiff"
              label="Monster Level Coefficient"
              class="q-mb-md"
              v-bind="monsterLvlCoefDiffAttrs"
              step="0.1"
            >
              <template v-slot:prepend>
                <q-icon name="pest_control">
                  <q-tooltip
                    >Determines the level range of monsters to fight</q-tooltip
                  >
                </q-icon>
              </template>
            </q-input>

            <q-input
              type="number"
              dense
              v-model.number="fightsPerMinute"
              label="Fights per minute"
              class="q-mb-md"
              v-bind="fightsPerMinuteAttrs"
              step="1"
            >
              <template v-slot:prepend>
                <q-icon name="timer">
                  <q-tooltip>Number of fights to attempt per minute</q-tooltip>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Character Selection -->
          <div class="form-group">
            <div class="text-subtitle2 q-mb-sm">Character Settings</div>
            <q-select
              class="q-mb-md"
              dense
              outlined
              v-model="character"
              v-bind="characterAttrs"
              use-input
              :options="filteredCharacters"
              @filter="onFilterCharacters"
              label="Main character"
              option-label="name"
              :loading="isCharactersLoading"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No characters found
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar>
                      <img :src="getCharacterAvatar(scope.opt.breedId)" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption
                      >Level {{ scope.opt.level }} •
                      {{ scope.opt.serverName }}</q-item-label
                    >
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:append>
                <q-icon
                  name="close"
                  class="cursor-pointer"
                  @click.stop.prevent="character = null"
                  v-show="character"
                />
              </template>
            </q-select>

            <!-- Path Selection -->
            <q-select
              class="q-mb-md"
              dense
              outlined
              v-model="path"
              v-bind="pathAttrs"
              :options="filteredPaths"
              @filter="onFilterPaths"
              label="Fight Path"
              option-label="id"
              :loading="isPathsLoading"
              use-input
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No paths found
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:append>
                <q-icon
                  name="close"
                  class="cursor-pointer"
                  @click.stop.prevent="path = null"
                  v-show="path"
                />
              </template>
            </q-select>
          </div>

          <!-- Unload Settings -->
          <div class="form-group">
            <div class="text-subtitle2 q-mb-sm">Unload Configuration</div>
            <q-select
              class="q-mb-md"
              dense
              outlined
              v-model="unloadType"
              v-bind="unloadTypeAttrs"
              :options="sessionUnloadTypeChoices"
              label="Unload Type"
              option-label="label"
              option-value="value"
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon :name="unloadTypeIcon">
                  <q-tooltip>{{ unloadTypeTooltip }}</q-tooltip>
                </q-icon>
              </template>
            </q-select>

            <q-slide-transition>
              <q-select
                v-show="unloadType === UnloadTypeEnum.SELLER"
                dense
                outlined
                v-model="seller"
                v-bind="sellerAttrs"
                :options="filteredSellers"
                @filter="onFilterSellers"
                use-input
                label="Seller Character"
                option-label="name"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar>
                        <img :src="getCharacterAvatar(scope.opt.breedId)" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption
                        >Level {{ scope.opt.level }} •
                        {{ scope.opt.serverName }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:append>
                  <q-icon
                    name="close"
                    class="cursor-pointer"
                    @click.stop.prevent="seller = null"
                    v-show="seller"
                  />
                </template>
              </q-select>
            </q-slide-transition>
          </div>
        </q-card-section>

        <!-- Action Buttons -->
        <q-card-actions align="right" class="bg-grey-1">
          <q-btn
            flat
            dense
            color="grey"
            label="Cancel"
            @click="onCancel"
            :disable="isSubmitting"
          >
            <q-icon name="close" class="q-ml-sm" />
          </q-btn>
          <q-btn
            flat
            dense
            color="primary"
            :label="isEditMode ? 'Update' : 'Create'"
            @click="onSubmit"
            :loading="isSubmitting"
            :disable="!isFormValid || !isDirty"
          >
            <q-icon :name="isEditMode ? 'update' : 'add'" class="q-ml-sm" />
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
import sessionsApiInstance from "src/api/session";
import pathsApiInstance from "src/api/paths";
import charactersApiInstance from "src/api/characters";
import { useNotify, useDebounce, useQuasarValidation } from "src/composables";

const { quasarConfig } = useQuasarValidation();

// Composables
const { notify } = useNotify();
const { debounce } = useDebounce();

// Props and Emits
const props = defineProps({
  currSessionId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "finished"]);

// Computed Properties
const isEditMode = computed(() => !!props.currSessionId);
const isFormValid = computed(() => Object.keys(errors.value).length === 0);
const isDirty = ref(false);

// API Data Fetching
const { data: characters, isLoading: isCharactersLoading } =
  charactersApiInstance.useGetItems();

const { data: paths, isLoading: isPathsLoading } =
  pathsApiInstance.useGetItems();

const {
  data: aSession,
  isLoading: isASessionLoading,
  error: aSessionError,
} = isEditMode.value
  ? sessionsApiInstance.useGetItem(props.currSessionId)
  : { data: ref(null), isLoading: ref(false), error: ref(null) };

// Mutations
const { mutate: addSession, isLoading: isAddSubmitting } =
  sessionsApiInstance.useAddItem();
const { mutate: updateSession, isLoading: isUpdateSubmitting } =
  sessionsApiInstance.useUpdateItem();

const isSubmitting = computed(() => isAddSubmitting || isUpdateSubmitting);

// Form Validation Schema
const validationSchema = yup.object({
  name: yup
    .string()
    .required("Session Name is required")
    .min(3, "Session Name must be at least 3 characters")
    .max(50, "Session Name must be less than 50 characters")
    .matches(
      /^[a-zA-Z0-9_-]*$/,
      "Session Name can only contain alphanumeric characters, dashes and underscores"
    ),
  character: yup.object().nullable().required("Character is required"),
  monsterLvlCoefDiff: yup
    .number()
    .required("Monster Level Coefficient is required")
    .min(0.1, "Minimum value is 0.1")
    .test(
      "decimal-places",
      "Value must have at most 1 decimal place",
      (value) => !value || /^\d+(\.\d)?$/.test(value.toString())
    ),
  fightsPerMinute: yup
    .number()
    .required("Fights per minute is required")
    .min(1, "Minimum value is 1")
    .integer("Must be a whole number"),
  path: yup.object().nullable().required("Path is required"),
  unloadType: yup.string().required("Unload Type is required"),
  seller: yup.mixed().when("unloadType", {
    is: UnloadTypeEnum.SELLER,
    then: () =>
      yup
        .object()
        .nullable()
        .required("Seller is required when unloading to seller")
        .test(
          "different-account",
          "Seller must belong to a different account than the character",
          function (value) {
            const { character } = this.parent;
            return !character || !value || character.account !== value.account;
          }
        )
        .test(
          "same-server",
          "Seller must be on the same server as the character",
          function (value) {
            const { character } = this.parent;
            return (
              !character || !value || character.serverName === value.serverName
            );
          }
        ),
    otherwise: () => yup.mixed().nullable(),
  }),
});

// Form Setup
const {
  handleSubmit,
  errors,
  resetForm,
  defineField,
  values: formValues,
} = useForm({
  validationSchema,
  initialValues: {
    name: "",
    character: null,
    monsterLvlCoefDiff: 4.0,
    fightsPerMinute: 1,
    path: null,
    unloadType: UnloadTypeEnum.BANK,
    seller: null,
  },
});

// Field Definitions
const [name, nameAttrs] = defineField("name", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [monsterLvlCoefDiff, monsterLvlCoefDiffAttrs] = defineField(
  "monsterLvlCoefDiff",
  quasarConfig
);
const [fightsPerMinute, fightsPerMinuteAttrs] = defineField(
  "fightsPerMinute",
  quasarConfig
);
const [path, pathAttrs] = defineField("path", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);

// Filtering state
const characterFilter = ref("");
const pathFilter = ref("");
const sellerFilter = ref("");

// Computed properties for filtering
const filteredCharacters = computed(() => {
  if (!characters.value) return [];

  const searchTerm = characterFilter.value.toLowerCase();
  if (!searchTerm) return characters.value;

  return characters.value.filter(
    (char) =>
      char.name.toLowerCase().includes(searchTerm) ||
      char.serverName.toLowerCase().includes(searchTerm)
  );
});

const filteredPaths = computed(() => {
  if (!paths.value) return [];

  const searchTerm = pathFilter.value.toLowerCase();
  if (!searchTerm) return paths.value;

  return paths.value.filter((path) =>
    path.id.toLowerCase().includes(searchTerm)
  );
});

const filteredSellers = computed(() => {
  if (!characters.value || !character.value) return [];

  const searchTerm = sellerFilter.value.toLowerCase();
  let filtered = characters.value.filter(
    (char) =>
      char.serverName === character.value.serverName &&
      char.account !== character.value.account
  );

  if (searchTerm) {
    filtered = filtered.filter(
      (char) =>
        char.name.toLowerCase().includes(searchTerm) ||
        char.serverName.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

// UI helper computed properties
const unloadTypeIcon = computed(() => {
  return unloadType.value === UnloadTypeEnum.BANK ? "account_balance" : "store";
});

const unloadTypeTooltip = computed(() => {
  return unloadType.value === UnloadTypeEnum.BANK
    ? "Resources will be stored in the bank"
    : "Resources will be transferred to a seller character";
});

// Session type choices
const sessionUnloadTypeChoices = [
  { label: "Bank", value: UnloadTypeEnum.BANK },
  { label: "Seller", value: UnloadTypeEnum.SELLER },
];

// Debounced filter handlers
const onFilterCharacters = debounce((val, update) => {
  characterFilter.value = val;
  update();
}, 300);

const onFilterPaths = debounce((val, update) => {
  pathFilter.value = val;
  update();
}, 300);

const onFilterSellers = debounce((val, update) => {
  sellerFilter.value = val;
  update();
}, 300);

// Name generation helper
const generateRandomName = () => {
  const prefix = ["Fight", "Battle", "Combat", "Arena", "Duel"];
  const suffix = ["Session", "Run", "Instance", "Route", "Path"];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomSuffix = suffix[Math.floor(Math.random() * suffix.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  name.value = `${randomPrefix}_${randomSuffix}_${randomNum}`;
};

// Form submission handler
const onSubmit = handleSubmit(async (values) => {
  try {
    const session = {
      ...values,
      character: values.character?.id,
      seller: values.seller?.id,
      path: values.path?.id,
      type: SessionTypeEnum.SOLO_FIGHT,
    };

    if (isEditMode.value) {
      await updateSession({ id: props.currSessionId, newItem: session });
      notify.success("Session updated successfully");
    } else {
      await addSession(session);
      notify.success("Session created successfully");
    }
    closeModal();
  } catch (error) {
    console.error("Error submitting form:", error);
    notify.error(error.response?.data?.message || "Error submitting form");
  }
});

// Utility functions
const getCharacterAvatar = (breedId) => {
  return new URL(`/src/assets/classes/symbol_${breedId}.png`, import.meta.url)
    .href;
};

const focusNext = (e) => {
  const inputs = document.querySelectorAll("input, select");
  const currentIndex = Array.from(inputs).indexOf(e.target);
  if (currentIndex < inputs.length - 1) {
    inputs[currentIndex + 1].focus();
  }
};

// Lifecycle hooks and watchers
onMounted(() => {
  if (!isEditMode.value) {
    resetForm({
      values: {
        name: uuidv4(),
        character: null,
        monsterLvlCoefDiff: 4.0,
        fightsPerMinute: 1,
        path: null,
        unloadType: UnloadTypeEnum.BANK,
        seller: null,
      },
    });
  }
});

// Watch for session data changes
watch(
  aSession,
  (newSession) => {
    if (newSession && isEditMode.value) {
      resetForm({
        values: {
          name: newSession.name,
          character: newSession.character,
          monsterLvlCoefDiff: newSession.monsterLvlCoefDiff,
          fightsPerMinute: newSession.fightsPerMinute,
          path: newSession.path,
          unloadType: newSession.unloadType,
          seller: newSession.seller,
        },
      });
    }
  },
  { immediate: true }
);

// Watch for form value changes to track dirty state
watch(
  formValues,
  () => {
    isDirty.value = true;
  },
  { deep: true }
);

// Error handling
watch(aSessionError, (error) => {
  if (error && isEditMode.value) {
    console.error("Error loading session:", error);
    notify.error("Error loading session data");
  }
});

// Modal handling
const onDialogHide = () => {
  if (isDirty.value) {
    // Optionally show confirmation dialog
    closeModal();
  } else {
    closeModal();
  }
};

const onCancel = () => {
  if (isDirty.value) {
    // Optionally show confirmation dialog
    closeModal();
  } else {
    closeModal();
  }
};

const closeModal = () => {
  emit("update:modelValue", false);
  emit("finished");
};
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

.scroll-container {
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.form-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* Smooth transitions */
.q-slide-transition {
  transition: all 0.3s ease;
}

/* Custom scrollbar */
.scroll-container::-webkit-scrollbar {
  width: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
