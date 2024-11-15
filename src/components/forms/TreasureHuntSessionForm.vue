<template>
  <q-dialog persistent @hide="onDialogHide">
    <div class="q-pa-md q-ma-md">
      <q-card>
        <!-- Header -->
        <q-card-section class="bg-primary text-white">
          <div class="row items-center">
            <div class="text-h6 col">Treasure Hunt</div>
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
          class="q-pa-md q-ma-md"
          :class="{ 'blur-content': isEditMode && isASessionLoading }"
        >
          <q-input
            dense
            v-model="id"
            label="Session Name"
            class="q-mb-md"
            v-bind="nameAttrs"
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
            :options="filteredCharacters"
            @filter="onFilterCharacters"
            label="Character"
            option-label="name"
            :loading="isCharactersLoading"
          >
            <template v-slot:hint>Character that will lead the bots party.</template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-avatar>
                    <img :src="getCharacterAvatar(scope.opt.breedId)" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.name }}</q-item-label>
                  <q-item-label caption>Level {{ scope.opt.level }} • {{ scope.opt.serverName }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                @click.stop.prevent="character = null"
                :disable="!character"
              />
            </template>
          </q-select>

          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="selectedUnloadType"
            v-bind="unloadTypeAttrs"
            :options="sessionUnloadTypeChoices"
            label="Select unload Type"
            option-label="label"
            option-value="value"
          >
            <template v-slot:hint>How would you like the bot to unload when full.</template>
          </q-select>

          <q-separator />

          <q-slide-transition>
            <q-select
              v-show="unloadType === UnloadTypeEnum.SELLER"
              dense
              outlined
              bottom-slots
              v-model="seller"
              v-bind="sellerAttrs"
              :options="filteredSellers"
              @filter="onFilterSellers"
              use-input
              label="Seller"
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
                    <q-item-label caption>Level {{ scope.opt.level }} • {{ scope.opt.serverName }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:append>
                <q-icon
                  name="close"
                  class="cursor-pointer"
                  @click.stop.prevent="seller = null"
                  :disable="!seller"
                />
              </template>
              <template v-slot:hint>Character that will collect the resources.</template>
            </q-select>
          </q-slide-transition>
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
import charactersApiInstance from "src/api/characters";
import { useNotify, useDebounce, useQuasarValidation } from "src/composables";

const { quasarConfig } = useQuasarValidation();
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
  id: yup
    .string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 30 characters")
    .matches(
      /^[a-zA-Z0-9_-]*$/,
      "Name can only contain alphanumeric characters, dashes and underscores"
    ),
  character: yup.object().nullable().required("Character is required"),
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
    id: "",
    character: null,
    unloadType: UnloadTypeEnum.BANK,
    seller: null,
  },
});

// Field Definitions
const [id, nameAttrs] = defineField("id", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);

// Filtering state
const characterFilter = ref("");
const sellerFilter = ref("");

// Session type choices
const sessionUnloadTypeChoices = [
  { label: "Bank", value: UnloadTypeEnum.BANK },
  { label: "Seller", value: UnloadTypeEnum.SELLER },
];

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

// Computed for unload type
const selectedUnloadType = computed({
  get: () => unloadType.value,
  set: (option) => {
    unloadType.value = option.value;
  },
});

// Debounced filter handlers
const onFilterCharacters = debounce((val, update) => {
  characterFilter.value = val;
  update();
}, 300);

const onFilterSellers = debounce((val, update) => {
  sellerFilter.value = val;
  update();
}, 300);

// Form submission handler
const onSubmit = handleSubmit(async (values) => {
  try {
    const session = {
      ...values,
      character: values.character?.id,
      seller: values.seller?.id,
      type: SessionTypeEnum.TREASURE_HUNT,
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

// Lifecycle hooks and watchers
onMounted(() => {
  if (!isEditMode.value) {
    resetForm({
      values: {
        id: uuidv4(),
        character: null,
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
          id: newSession.id,
          character: newSession.character,
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
    closeModal();
  } else {
    closeModal();
  }
};

const onCancel = () => {
  if (isDirty.value) {
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
.blur-content {
  filter: blur(2px);
  pointer-events: none;
}

.q-select label {
  font-size: 12px;
}

/* Smooth transitions */
.q-slide-transition {
  transition: all 0.3s ease;
}
</style>
