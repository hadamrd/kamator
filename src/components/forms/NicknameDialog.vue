<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Set Nickname</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p>Please enter a nickname for the account with login: {{ accountLogin }}</p>
        <q-input
          v-model="nickname"
          label="Nickname"
          :rules="[val => !!val || 'Nickname is required']"
          @keyup.enter="submitNickname"
        />
      </q-card-section>

      <q-card-section>
        <q-btn @click="submitNickname" label="Validate" color="primary" class="full-width q-mt-md" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import accountsApiInstance from 'src/api/account';
import { response } from 'express';

export default {
  name: 'NicknameDialog',
  props: {
    accountLogin: {
      type: [Number, String],
      required: true
    },
    accountId: {
      type: [Number, String],
      required: true
    },
    modelValue: {
      type: Boolean,
      default: false
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar()

    const nickname = ref('')
    const loading = ref(false)

    const closeDialog = () => {
      nickname.value = ''
      emit("update:modelValue", false)
    }

    const submitNickname = async () => {
      if (!nickname.value) {
        $q.notify({
          color: 'negative',
          message: 'Please enter a nickname'
        })
        return
      }

      loading.value = true
      try {
        const response = await accountsApiInstance.setNickname(props.accountId, nickname.value);
        $q.notify({
          color: 'positive',
          message: 'Nickname set successfully'
        })
        emit('nickname-set', nickname.value)
        closeDialog();
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: `Error setting nickname: ${error.response.data.detail}`
        })
        console.log(response);
      } finally {
        loading.value = false
      }
    }

    return {
      nickname,
      loading,
      closeDialog,
      submitNickname
    }
  }
}
</script>
