<template>
  <q-dialog persistent>
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">{{ isEditMode ? 'Edit' : 'Create' }} Solo Fight</div>
        </q-card-section>
        <q-inner-loading :showing="isEditMode && isASessionLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <q-card-section class="q-pa-md q-ma-md" :class="{ 'blur-content': isEditMode && isASessionLoading }">
          <q-input
            dense
            v-model="name"
            label="Session Name"
            class="q-mb-md"
            v-bind="nameAttrs"
            :disable="isEditMode"
          />
          <q-input
            type="number"
            dense
            v-model.number="monsterLvlCoefDiff"
            label="Monster Level Coefficient"
            class="q-mb-md"
            v-bind="monsterLvlCoefDiffAttrs"
            step="0.1"
          >
            <template v-slot:append>
              <div class="row items-center">
                <q-btn
                  dense
                  flat
                  icon="remove"
                  @click="monsterLvlCoefDiff = Math.max(0.1, (parseFloat(monsterLvlCoefDiff) || 0) - 0.1)"
                  :disable="monsterLvlCoefDiff <= 0.1"
                />
                <q-btn
                  dense
                  flat
                  icon="add"
                  @click="monsterLvlCoefDiff = Math.round((parseFloat(monsterLvlCoefDiff) || 0) + 0.1 * 10) / 10"
                />
              </div>
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
            <template v-slot:append>
              <div class="row items-center">
                <q-btn
                  dense
                  flat
                  icon="remove"
                  @click="fightsPerMinute = Math.max(1, (parseInt(fightsPerMinute) || 0) - 1)"
                  :disable="fightsPerMinute <= 1"
                />
                <q-btn
                  dense
                  flat
                  icon="add"
                  @click="fightsPerMinute = (parseInt(fightsPerMinute) || 0) + 1"
                />
              </div>
            </template>
          </q-input>
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
            emit-value
            map-options
          />
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="path"
            v-bind="pathAttrs"
            :options="paths"
            label="Select fight path"
            option-label="id"
            :loading="isPathsLoading"
          >
            <template v-slot:hint>The path that the bot will follow.</template>
          </q-select>
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
  name: yup
    .string()
    .required("Session Name is required")
    .min(3, "Session Name must be at least 3 characters")
    .max(50, "Session Name must be less than 50 characters")
    .matches(/^[a-zA-Z0-9_-]*$/, "Session Name can only contain alphanumeric characters, dashes and underscores"),
  character: yup.object().nullable().required("Character is required"),
  monsterLvlCoefDiff: yup
    .number()
    .required("Monster Level Coefficient is required")
    .min(0.1, "Minimum value is 0.1")
    .test(
      "decimal-places",
      "Value must have at most 1 decimal place",
      value => !value || /^\d+(\.\d)?$/.test(value.toString())
    ),
  fightsPerMinute: yup
    .number()
    .required("Fights per minute is required")
    .min(1, "Minimum value is 1")
    .integer("Must be a whole number"),
  path: yup.object().nullable().required("Path is required"),
  unloadType: yup.string().required("Unload Type is required"),
  seller: yup.mixed().when('unloadType', {
    is: UnloadTypeEnum.SELLER,
    then: () => yup.object().nullable().required("Seller is required when unloading to seller")
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
          return !character || !value || character.serverName === value.serverName;
        }
      ),
    otherwise: () => yup.mixed().nullable()
  }),
});

// Use the form with initial values and the validation schema
const { handleSubmit, errors, resetForm, defineField } = useForm({
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

// Quasar configuration for handling field errors
const quasarConfig = (state) => ({
  props: {
    error: !!state.errors[0],
    "error-message": state.errors[0],
  },
});

// Define fields with VeeValidate and Quasar configuration
const [name, nameAttrs] = defineField("name", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [monsterLvlCoefDiff, monsterLvlCoefDiffAttrs] = defineField("monsterLvlCoefDiff", quasarConfig);
const [fightsPerMinute, fightsPerMinuteAttrs] = defineField("fightsPerMinute", quasarConfig);
const [path, pathAttrs] = defineField("path", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);

// Submit handler for the form
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

// Filter functions
const filterCharacters = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    characterSelectOptions.value = characters.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const filterSellers = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    sellerSelectOptions.value = sellerSelectOptions.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

// Watchers for session loading and errors
watch(aSession, (newSession) => {
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
}, { immediate: true });

watch(aSessionError, (error) => {
  if (error && isEditMode.value) {
    console.error("Error loading session:", error);
    // You might want to show an error message to the user here
  }
});

// Watchers for character and seller changes
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

// Initialize form on mount
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
      }
    });
  }
});

// Session unload type choices
const sessionUnloadTypeChoices = [
  { label: "Bank", value: UnloadTypeEnum.BANK },
  { label: "Seller", value: UnloadTypeEnum.SELLER },
];

// Close modal method
const closeModal = () => {
  emit("update:modelValue", false);
  emit("finished");
};
</script>
