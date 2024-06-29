<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card class="q-pa-md" style="max-width: 400px; min-width: 300px;">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">Enter Security Code</div>
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-md">
          A security code has been sent to your email. Please enter it below to continue.
        </div>
        <q-input v-model="securityCode" label="Security Code" outlined class="q-mt-md" />
      </q-card-section>

      <q-card-section>
        <q-btn @click="submitSecurityCode" label="Validate" color="primary" class="full-width q-mt-md" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from 'boot/axios'; // Adjust the import based on your project structure

export default {
  name: 'SecurityCodeInput',
  props: {
    modelValue: {
        type: Boolean,
        default: false
    }
  },
  emits: ['update:modelValue'],
  methods: {
    async submitSecurityCode() {
      try {
        const response = await api.post('accounts/security-code', {
          code: this.securityCode
        });
        console.log("Security code submitted by the user:", this.securityCode);
        this.$q.notify({
          type: 'positive',
          message: 'Security code validated successfully.'
        });
        // Add any additional success handling here
      } catch (error) {
        console.error('Error during security code validation:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to validate security code.'
        });
      }
      this.$emit("update:modelValue", false);
    },
    closeDialog() {
      this.$emit("update:modelValue", false);
    }
  }
};
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
