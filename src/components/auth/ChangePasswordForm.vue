<template>
  <q-card class="q-pa-md q-ma-md" style="min-width: 300px; min-height: 300px; position: relative;">
      <q-form class="q-px-sm q-pt-xl">
          <q-input v-model="newPassword" v-bind="newPasswordAttrs" square clearable type="password"
              label="New password">
          </q-input>
          <q-input v-model="confirmPassword" v-bind="confirmPasswordAttrs" square clearable type="password"
              label="Confirm password">
          </q-input>
      </q-form>
      <q-card-actions class="q-px-lg" style="position: absolute; bottom: 16px; right: 16px;">
        <q-btn dense outlined unelevated color="negative" class="text-white" label="Cancel" @click="close" />
        <q-btn dense outlined unelevated color="primary" class="text-white" label="Confirm" @click="submit" />
      </q-card-actions>
  </q-card>
</template>


<script>
import { defineComponent } from "vue";
import * as yup from "yup";
import { useUserStore } from "src/stores/users";
import { useForm } from "vee-validate";


export default defineComponent({
  props: {
      id: {
          type: Number,
          required: true,
      },
  },
  emits: ['success', 'close'],
  setup(_, { emit }) {

      const userStore = useUserStore();
      const schema = yup.object({
          newPassword: yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
          confirmPassword: yup.string().oneOf([yup.ref('newPassword'), null], "Passwords must match").required("Confirm Password is required")
      });

      const { handleSubmit, defineField } = useForm({ validationSchema: schema });

      const quasarConfig = (state) => ({
          props: {
              error: !!state.errors[0],
              'error-message': state.errors[0],
          },
      });

      const [newPassword, newPasswordAttrs] = defineField('newPassword', quasarConfig);
      const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword', quasarConfig);

      const submit = handleSubmit(async (values) => {
          const response = await userStore.changePassword(values);
          if (response.status === 200) {
              emit('success');
          }
      });

      const close = () => {
        emit('close');
      }

      return {
          userStore: useUserStore(),
          newPassword,
          confirmPassword,
          newPasswordAttrs,
          confirmPasswordAttrs,
          submit,
          close
      };
  }
});
</script>



<style scoped></style>
