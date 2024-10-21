<template>
  <q-dialog persistent>
    <div class="q-pa-md q-ma-md">
      <q-card>
        <q-card-section class="bg-primary text-center text-white">
          <div class="text-h6">Solo fight</div>
        </q-card-section>
        <q-card-section class="q-pa-md q-ma-md">
          <q-input dense v-model="name" class="q-mb-md" v-bind="nameAttrs" />
          <q-input
            v-model.number="monsterLvlCoefDiff"
            class="q-mb-md"
            v-bind="monsterLvlCoefDiffAttrs"
          >
          </q-input>
          <q-input
            v-model.number="fightsPerMinute"
            label="Fights per minute"
            class="q-mb-md"
            v-bind="fightsPerMinuteAttrs"
          >
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
            @filter="filterFn"
            @input="clearFilter"
            label="Select character"
            option-label="name"
            :loading="isCharactersLoading"
          >
            <template v-slot:hint>Main character.</template>
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                icon="clear"
                @click.stop.prevent="character = null"
                :disable="!character"
              ></q-icon>
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
            <template v-slot:hint
              >How would you like the bot to unload when full.</template
            >
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
          <q-separator />
          <q-select
            dense
            outlined
            bottom-slots
            v-model="seller"
            v-bind="sellerAttrs"
            :options="sellerSelectOptions"
            @filter="filterFn"
            @input="clearFilter"
            use-input
            @change="clearInput"
            label="Seller"
            option-label="name"
            v-show="unloadType === UnloadTypeEnum.SELLER"
          >
            <template v-slot:append>
              <q-icon
                name="close"
                class="cursor-pointer"
                icon="clear"
                @click.stop.prevent="seller = null"
                :disable="!seller"
              ></q-icon>
            </template>
            <template v-slot:hint
              >Character that will collect the resources.</template
            >
          </q-select>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            flat
            dense
            color="primary"
            class="q-mr-md"
            label="Confirm"
            @click="onSubmit"
            ><q-icon name="check"
          /></q-btn>
          <q-btn
            flat
            dense
            color="negative"
            class="q-ml-md"
            label="Cancel"
            @click="closeModal"
            ><q-icon name="close"
          /></q-btn>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, computed, watch } from "vue";
import { SessionTypeEnum, UnloadTypeEnum } from "src/enums/sessionEnums";
import * as yup from "yup";
import { useForm } from "vee-validate";
import sessionsApiInstance from "src/api/session";
import pathsApiInstance from "src/api/paths";
import charactersApiInstance from "src/api/characters";

// Fetch data using API instances
const { data: characters, isLoading: isCharactersLoading } =
  charactersApiInstance.useGetItems();
const { data: paths, isLoading: isPathsLoading } =
  pathsApiInstance.useGetItems();
const { data: aSession, isLoading: isASessionLoading } =
  sessionsApiInstance.useGetItem(currSessionId);

// Define form validation schema using Yup
const validationSchema = yup.object({
  name: yup
    .string()
    .required("Session ID is required")
    .min(3, "Session ID must be at least 3 characters")
    .max(50, "Session ID must be less than 50 characters"),
  character: yup.object().nullable().required("Character is required"),
  monsterLvlCoefDiff: yup
    .number()
    .required("Monster Coeff Diff is required")
    .min(0.1, "Minimum value is 0.1"),
  fightsPerMinute: yup
    .number()
    .required("Fights per minute is required")
    .min(1, "Minimum value is 1"),
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
  unloadType: yup.string().required("Unload Type is required"),
  path: yup.object().nullable().required("Path is required"),
});

// Use the form with initial values and the validation schema
const { handleSubmit, defineField, setFieldError } = useForm({
  initialValues: {
    name: "",
    character: null,
    monsterLvlCoefDiff: 4,
    fightsPerMinute: 1,
    seller: null,
    unloadType: UnloadTypeEnum.BANK,
    path: null,
  },
  validationSchema,
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
const [monsterLvlCoefDiff, monsterLvlCoefDiffAttrs] = defineField(
  "monsterLvlCoefDiff",
  quasarConfig
);
const [fightsPerMinute, fightsPerMinuteAttrs] = defineField(
  "fightsPerMinute",
  quasarConfig
);
const [seller, sellerAttrs] = defineField("seller", quasarConfig);
const [unloadType, unloadTypeAttrs] = defineField("unloadType", quasarConfig);
const [path, pathAttrs] = defineField("path", quasarConfig);

// Submit handler for the form
const onSubmit = handleSubmit(async (values) => {
  try {
    await sessionsApiInstance.addItem(values);
    emit("update:modelValue", false);
  } catch (error) {
    if (error?.response?.data) {
      const serverErrors = error.response.data;
      for (const field in serverErrors) {
        setFieldError(field, String(serverErrors[field][0]));
      }
    }
  }
});

// Character and seller selection logic
const characterSelectOptions = computed(() => {
  if (!characters.value || !seller.value) {
    return characters.value || [];
  }

  return characters.value.filter((character) => {
    const notSameAccount = character.account !== seller.value.account;
    const notTheSellerItself = character.id !== seller.value.id;
    const sameServer = seller.value.serverName === character.serverName;

    return sameServer && notSameAccount && notTheSellerItself;
  });
});

const sellerSelectOptions = computed(() => {
  if (!characters.value || !character.value) {
    return characters.value || [];
  }

  return characters.value.filter((seller) => {
    const notSameAccount = seller.account !== character.value.account;
    const notTheCharacterItself = seller.id !== character.value.id;
    const sameServer = seller.serverName === character.value.serverName;

    return sameServer && notSameAccount && notTheCharacterItself;
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
    newSeller.account === oldSeller?.account &&
    newSeller.serverName === oldSeller?.serverName
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
const filterFn = (val, update) => {
  update(() => {
    filterValue.value = val;
  });
};

const clearFilter = () => {
  filterValue.value = "";
};

const clearInput = () => {
  this.$refs.select.clear();
};

// Close modal method
const closeModal = () => {
  emit("update:modelValue", false);
};
</script>

<style scoped>
.q-select label {
  font-size: 12px;
}
</style>
