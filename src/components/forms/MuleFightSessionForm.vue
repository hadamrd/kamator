<template>
  <q-dialog persistent @hide="onDialogHide">
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <!-- Header -->
        <q-card-section class="bg-primary text-white">
          <div class="row items-center">
            <div class="text-h6 col">
              {{ isEditMode ? "Edit" : "Create" }} Mule Fight
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

          <!-- Character Settings -->
          <div class="form-group">
            <div class="text-subtitle2 q-mb-sm">Character Settings</div>

            <!-- Main Character Selection -->
            <q-select
              class="q-mb-md"
              dense
              outlined
              v-model="character"
              v-bind="characterAttrs"
              use-input
              :options="filteredCharacters"
              @filter="onFilterCharacters"
              label="Main Character"
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
                    <q-item-label caption>
                      Level {{ scope.opt.level }} • {{ scope.opt.serverName }}
                    </q-item-label>
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
              <template v-slot:hint>
                Character that will perform the fights
              </template>
            </q-select>

            <!-- Leader Character Selection -->
            <q-select
              class="q-mb-md"
              dense
              outlined
              v-model="leader"
              v-bind="leaderAttrs"
              use-input
              :options="filteredLeaders"
              @filter="onFilterLeaders"
              label="Party Leader"
              option-label="name"
              :loading="isCharactersLoading"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No available leaders found
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
                    <q-item-label caption>
                      Level {{ scope.opt.level }} • {{ scope.opt.serverName }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:append>
                <q-icon
                  name="close"
                  class="cursor-pointer"
                  @click.stop.prevent="leader = null"
                  v-show="leader"
                />
              </template>
              <template v-slot:hint>
                Character that will lead the party
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
                use-input
                :options="filteredSellers"
                @filter="onFilterSellers"
                label="Seller Character"
                option-label="name"
                :loading="isCharactersLoading"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No available sellers found
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
                      <q-item-label caption>
                        Level {{ scope.opt.level }} • {{ scope.opt.serverName }}
                      </q-item-label>
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
  leader: yup
    .object()
    .nullable()
    .required("Leader is required")
    .test(
      "different-account",
      "Leader must be from a different account than the character",
      function (value) {
        const { character } = this.parent;
        return !character || !value || character.account !== value.account;
      }
    )
    .test(
      "same-server",
      "Leader must be on the same server as the character",
      function (value) {
        const { character } = this.parent;
        return !character || !value || character.serverName === value.serverName;
      }
    ),
  unloadType: yup.string().required("Unload Type is required"),
  seller: yup.mixed().when("unloadType", {
    is: UnloadTypeEnum.SELLER,
    then: () =>
      yup
        .object()
        .nullable()
        .required("Seller is required when unloading to seller")
        .test(
          "different-accounts",
          "Seller must be from a different account than both character and leader",
          function (value) {
            const { character, leader } = this.parent;
            return (
              !character ||
              !leader ||
              !value ||
              (character.account !== value.account &&
                leader.account !== value.account)
            );
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
    leader: null,
    unloadType: UnloadTypeEnum.BANK,
    seller: null,
  },
});

// Field Definitions
const [name, nameAttrs] = defineField("name", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [leader, leaderAttrs] = defineField("leader", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);

// Filtering state
const characterFilter = ref("");
const leaderFilter = ref("");
const sellerFilter = ref("");

// Computed properties for filtering
const filteredCharacters = computed(() => {
  if (!characters.value) return [];

  const searchTerm = characterFilter.value.toLowerCase();
  let filtered = characters.value;

  if (leader.value) {
    filtered = filtered.filter(
      char =>
        char.account !== leader.value.account &&
        char.serverName === leader.value.serverName
    );
  }

  if (searchTerm) {
    filtered = filtered.filter(
      char =>
        char.name.toLowerCase().includes(searchTerm) ||
        char.serverName.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const filteredLeaders = computed(() => {
  if (!characters.value || !character.value) return [];

  const searchTerm = leaderFilter.value.toLowerCase();
  let filtered = characters.value.filter(
    char =>
      char.serverName === character.value.serverName &&
      char.account !== character.value.account
  );

  if (searchTerm) {
    filtered = filtered.filter(
      char =>
        char.name.toLowerCase().includes(searchTerm) ||
        char.serverName.toLowerCase().includes(searchTerm)
    );
  }

  return filtered;
});

const filteredSellers = computed(() => {
    if (!characters.value || !character.value || !leader.value) return [];

    const searchTerm = sellerFilter.value.toLowerCase();
    let filtered = characters.value.filter(
      char =>
        char.serverName === character.value.serverName &&
        char.account !== character.value.account &&
        char.account !== leader.value.account
    );

    if (searchTerm) {
      filtered = filtered.filter(
        char =>
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

  const onFilterLeaders = debounce((val, update) => {
    leaderFilter.value = val;
    update();
  }, 300);

  const onFilterSellers = debounce((val, update) => {
    sellerFilter.value = val;
    update();
  }, 300);

  // Name generation helper
  const generateRandomName = () => {
    const prefix = ["Mule", "Multi", "Team", "Group", "Party"];
    const suffix = ["Fight", "Battle", "Combat", "Run", "Squad"];
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
        leader: values.leader?.id,
        seller: values.seller?.id,
        type: SessionTypeEnum.MULE_FIGHT,
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

  // Character avatar helper
  const getCharacterAvatar = (breedId) => {
    return new URL(`/src/assets/classes/symbol_${breedId}.png`, import.meta.url)
      .href;
  };

  // Focus management
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
          leader: null,
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
            leader: newSession.leader,
            unloadType: newSession.unloadType,
            seller: newSession.seller,
          },
        });
      }
    },
    { immediate: true }
  );

  // Watch for character changes to reset dependent fields
  watch(character, (newChar, oldChar) => {
    if (!newChar) {
      leader.value = null;
      seller.value = null;
      return;
    }

    // Reset leader if server changed or same account
    if (
      leader.value &&
      (newChar.serverName !== leader.value.serverName ||
        newChar.account === leader.value.account)
    ) {
      leader.value = null;
    }

    // Reset seller if conditions no longer met
    if (
      seller.value &&
      (newChar.serverName !== seller.value.serverName ||
        newChar.account === seller.value.account)
    ) {
      seller.value = null;
    }
  });

  // Watch for leader changes
  watch(leader, (newLeader) => {
    if (!newLeader) {
      seller.value = null;
      return;
    }

    // Reset character if on same account
    if (character.value && character.value.account === newLeader.account) {
      character.value = null;
    }

    // Reset seller if on same account as leader
    if (seller.value && seller.value.account === newLeader.account) {
      seller.value = null;
    }
  });

  // Watch for unload type changes
  watch(unloadType, (newVal) => {
    if (newVal !== UnloadTypeEnum.SELLER) {
      seller.value = null;
    }
  });

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
      // Show confirmation dialog if needed
      closeModal();
    } else {
      closeModal();
    }
  };

  const onCancel = () => {
    if (isDirty.value) {
      // Show confirmation dialog if needed
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
