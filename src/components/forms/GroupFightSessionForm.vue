<template>
  <q-dialog persistent>
    <div class="q-pa-md q-ma-md min-width-800px">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">{{ isEditMode ? 'Edit' : 'Create' }} Group Fight</div>
        </q-card-section>
        <q-inner-loading :showing="isEditMode && isASessionLoading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <q-card-section class="q-pa-md q-ma-md" :class="{ 'blur-content': isEditMode && isASessionLoading }">
          <q-input
            dense
            v-model="id"
            label="Session ID"
            class="q-mb-md"
            v-bind="idAttrs"
            :disable="isEditMode"
          />
          <q-input
            type="number"
            step="0.1"
            v-model.number="monsterLvlCoefDiff"
            label="Monster Coeff Diff"
            class="q-mb-md"
            v-bind="monsterLvlCoefDiffAttrs"
          />
          <q-input
            type="number"
            step="1"
            v-model.number="fightsPerMinute"
            label="Fights per minute"
            class="q-mb-md"
            v-bind="fightsPerMinuteAttrs"
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
            label="Character"
            option-label="name"
            :loading="isCharactersLoading"
          >
            <template v-slot:hint>Character that will lead the bots party.</template>
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
            dense
            class="q-mb-md"
            outlined
            bottom-slots
            v-model="followers"
            v-bind="followersAttrs"
            use-input
            multiple
            emit-value
            input-debounce="0"
            label="Select mules"
            option-label="name"
            :options="followersSelectOptions"
            @filter="filterFollowers"
            :loading="isCharactersLoading"
          >
            <template v-slot:hint>Characters that will follow the leader.</template>
            <template v-slot:selected-item="{ opt }">
              <q-chip
                dense
                class="q-mr-xs"
                removable
                @remove="removeFollower(opt)"
              >{{ opt.name }}</q-chip>
            </template>
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                @click.stop.prevent="followers = []"
                :disable="followers.length < 1"
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
          >
            <template v-slot:hint>How would you like the bot to unload when full.</template>
          </q-select>
          <q-select
            class="q-mb-md"
            dense
            outlined
            bottom-slots
            v-model="path"
            v-bind="pathAttrs"
            :options="paths"
            label="Select farm path"
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
            :loading="isCharactersLoading"
          >
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
  id: yup
    .string()
    .required("Session ID is required")
    .min(3, "Session ID must be at least 3 characters")
    .max(50, "Session ID must be less than 50 characters")
    .matches(/^[a-zA-Z0-9_-]*$/, "Session ID can only contain alphanumeric characters, dashes and underscores"),
  character: yup.object().nullable().required("Character is required"),
  monsterLvlCoefDiff: yup.number().required("Monster Coef Diff is required").min(0, "Minimum value is 0"),
  fightsPerMinute: yup.number().required("Fights per minute is required").min(1, "Minimum value is 1"),
  followers: yup.array().of(yup.object()),
  unloadType: yup.string().required("Unload Type is required"),
  path: yup.object().nullable().required("Path is required"),
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
    monsterLvlCoefDiff: 4,
    fightsPerMinute: 1,
    followers: [],
    unloadType: UnloadTypeEnum.BANK,
    path: null,
    seller: null,
  },
});

// Define fields with VeeValidate and Quasar configuration
const [id, idAttrs] = defineField("id", quasarConfig);
const [character, characterAttrs] = defineField("character", quasarConfig);
const [monsterLvlCoefDiff, monsterLvlCoefDiffAttrs] = defineField("monsterLvlCoefDiff", quasarConfig);
const [fightsPerMinute, fightsPerMinuteAttrs] = defineField("fightsPerMinute", quasarConfig);
const [followers, followersAttrs] = defineField("followers", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [path, pathAttrs] = defineField("path", quasarConfig);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);


// Computed properties for select options
const characterSelectOptions = computed(() => {
  if (!characters.value || !seller.value) {
    return characters.value || [];
  }

  return characters.value.filter((ch) => {
    return (ch.account !== seller.value?.account);
  });
});

const followersSelectOptions = computed(() => {
  if (!characters.value || !character.value) {
    return [];
  }

  return characters.value.filter((follower) => {
    const notSameCharacterAccount = follower.account !== character.value.account;
    const notSameSellerAccount = !seller.value || follower.account !== seller.value.account;
    const sameCharacterServer = follower.serverName === character.value.serverName;

    return sameCharacterServer && notSameCharacterAccount && notSameSellerAccount;
  });
});

const sellerSelectOptions = computed(() => {
  if (!characters.value || !character.value) {
    return characters.value || [];
  }

  return characters.value.filter((seller) => {
    const notSameAccountAsCharacter = seller.account !== character.value.account;
    const notTheCharacterItself = seller.id !== character.value.id;
    const sameServer = seller.serverName === character.value.serverName;
    const notAFollowerAccount = !followers.value.some(
      (follower) => follower.account === seller.account
    );

    return sameServer && notSameAccountAsCharacter && notTheCharacterItself && notAFollowerAccount;
  });
});

// Filter functions
const filterCharacters = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    characterSelectOptions.value = characters.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const filterFollowers = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    followersSelectOptions.value = followersSelectOptions.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const filterSellers = (val, update, abort) => {
  update(() => {
    const needle = val.toLowerCase();
    sellerSelectOptions.value = sellerSelectOptions.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
  });
};

const removeFollower = (option) => {
  followers.value = followers.value.filter((o) => o.id !== option.id);
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
        monsterLvlCoefDiff: newSession.monsterLvlCoefDiff,
        fightsPerMinute: newSession.fightsPerMinute,
        followers: newSession.followers,
        unloadType: newSession.unloadType,
        path: newSession.path,
        seller: newSession.seller,
      },
    });
  }
}, { immediate: true });

// Error handling for session loading
watch(aSessionError, (error) => {
  if (error && isEditMode.value) {
    console.error("Error loading session:", error);
    // You might want to show an error message to the user here
  }
});

// Watchers for interdependent fields
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
  // Reset followers if they're not on the same server as the new character
  followers.value = followers.value.filter(
    follower => follower.serverName === newval.serverName
  );
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
  // Remove followers that are on the same account as the new seller
  followers.value = followers.value.filter(
    follower => follower.account !== newSeller.account
  );
});

watch(unloadType, (newVal) => {
  if (newVal === UnloadTypeEnum.BANK) {
    seller.value = null;
  }
});

onMounted(() => {
  if (!isEditMode.value) {
    resetForm({
      values: {
        id: uuidv4(),
        character: null,
        monsterLvlCoefDiff: 4,
        fightsPerMinute: 1,
        followers: [],
        unloadType: UnloadTypeEnum.BANK,
        path: null,
        seller: null,
      }
    });
  }
});

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response && error.response.data) {
    const serverErrors = error.response.data;
    for (const field in serverErrors) {
      if (typeof errors[field] === 'function') {
        errors[field](String(serverErrors[field][0]));
      }
    }
  } else {
    console.error("An error occurred:", error);
    // You might want to show a generic error message to the user here
  }
};

// Update the onSubmit function to use the error handler
const onSubmit = handleSubmit(async (values) => {
  try {
    const session = {
      ...values,
      character: values.character?.id,
      followers: values.followers.map(f => f.id),
      path: values.path?.id,
      seller: values.seller?.id,
      type: SessionTypeEnum.GROUP_FIGHT,
    };

    if (isEditMode.value) {
      await updateSession({ id: props.currSessionId, newItem: session });
    } else {
      await addSession(session);
    }
    closeModal();
  } catch (error) {
    handleApiError(error);
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
