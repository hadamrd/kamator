<template>
  <q-dialog :model-value="modelValue" persistent>
    <q-card class="q-pa-md" style="max-width: 400px; min-width: 300px;">
      <q-card-section>
        <div class="text-h6">Enter Security Code</div>
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-md">
          A security code has been sent to your email. Please enter it below to continue.
        </div>
        <div class="text-body2 q-mb-md">
          Please note: The code might take a few minutes to arrive.
        </div>
        <div class="row q-mt-md">
          <q-input
            v-for="(char, index) in securityCodeArray"
            :key="index"
            v-model="securityCodeArray[index]"
            outlined
            maxlength="1"
            class="code-input"
            ref="inputs"
            @input="focusNext(index)"
            @paste="handlePaste($event)"
            input-class="text-center"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <q-btn @click="submitSecurityCode" label="Validate" color="primary" class="full-width q-mt-md" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import accountsApiInstance from 'src/api/account';

export default {
  name: 'SecurityCodeInput',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    accountId: {
      type: Number,
    }
  },
  emits: ['update:modelValue', 'success'],
  data() {
    return {
      securityCodeArray: Array(6).fill(''),
    };
  },
  computed: {
    securityCode() {
      return this.securityCodeArray.join('');
    }
  },
  methods: {
    focusNext(index) {
      if (this.securityCodeArray[index] && index < this.securityCodeArray.length - 1) {
        this.$refs.inputs[index + 1].focus();
      } else if (!this.securityCodeArray[index] && index > 0) {
        this.$refs.inputs[index - 1].focus();
      }
    },
    handlePaste(event) {
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      if (paste.length === this.securityCodeArray.length) {
        this.securityCodeArray = paste.split('').slice(0, this.securityCodeArray.length);
        this.$nextTick(() => {
          this.$refs.inputs[this.securityCodeArray.length - 1].focus();
        });
      }
    },
    async submitSecurityCode() {
      try {
        await accountsApiInstance.securityCode(this.securityCode, this.accountId);
        console.log("Security code submitted by the user:", this.securityCode);
        this.$q.notify({
          type: 'positive',
          message: 'Security code validated successfully.'
        });
      } catch (error) {
        console.error('Error during security code validation:', error);
        this.$q.notify({
          type: 'negative',
          message: 'Failed to validate security code.'
        });
        this.closeDialog();
      }
      this.securityCodeArray = Array(6).fill('');
      this.$emit("success");
    },
    closeDialog() {
      this.securityCodeArray = Array(6).fill('');
      this.$emit("update:modelValue", false);
    }
  }
};
</script>

<style scoped>
.full-width {
  width: 100%;
}
.code-input {
  width: 40px;
  margin: 0 4px;
}
</style>
