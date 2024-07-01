<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Give bot server</div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          v-close-popup
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p>Please select the bot server</p>
        <q-select
          v-model="selectedServer"
          :options="dofusData.servers"
          option-label="name"
          option-value="id"
          label="Select Server"
          :loading="isDofusDataLoading"
          emit-value
          map-options
        />
      </q-card-section>

      <q-card-section>
        <q-btn
          @click="submit"
          :loading="loading"
          label="Validate"
          color="primary"
          class="full-width q-mt-md"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref } from "vue";
import { useQuasar } from "quasar";
import accountsApiInstance from "src/api/account";
import dofusDataApiInstance from "src/api/dofusData";

export default {
  name: "QuickBotCreateDialog",
  props: {
    accountId: {
      type: [Number, String],
      required: true,
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "submitted", "doubleAuth"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const selectedServer = ref(null);
    const loading = ref(false);

    const {
      isLoading: isDofusDataLoading,
      data: dofusData,
      isError: isDofusDataError,
      error: dofusDataError,
    } = dofusDataApiInstance.useGetItems();

    const closeDialog = () => {
      emit("update:modelValue", false);
    };

    const submit = async () => {
      if (!selectedServer.value) {
        $q.notify({
          color: "negative",
          message: "Please select a server",
        });
        return;
      }

      loading.value = true;
      try {
        const response = await accountsApiInstance.quickCharacterCreate(
          props.accountId,
          selectedServer.value
        );
        if (response.data.double_auth) {
          emit("doubleAuth", response);
          closeDialog();
        }
        console.log(response);
        $q.notify({
          color: "positive",
          message: "Character created successfully",
        });
        emit("submitted");
        closeDialog();
      } catch (error) {
        $q.notify({
          color: "negative",
          message: `Error creating character: ${error.response.data.message}`,
        });
      } finally {
        loading.value = false;
      }
    };

    return {
      selectedServer,
      isDofusDataLoading,
      loading,
      dofusData,
      isDofusDataError,
      dofusDataError,
      closeDialog,
      submit,
    };
  },
};
</script>
