<template>
  <div class="q-pa-md q-ma-md">
    <div class="row justify-center text-h6 text-purple-4 q-mb-md">
      KAMATOR
    </div>
    <q-form class="q-px-sm q-pt-xl">
      <q-input
        v-model="username"
        v-bind="usernameAttrs"
        square clearable
        type="text"
        label="Username"
        >
        <template #prepend>
          <q-icon name="person" />
        </template>
      </q-input>
      <q-input
        v-model="password"
        v-bind="passwordAttrs"
        square
        clearable
        type="password"
        label="Password"
        >
        <template #prepend>
          <q-icon name="lock" />
        </template>
      </q-input>
      <div class="text-right q-my-md">
        <q-btn flat dense label="Forgot password?" />
      </div>
    </q-form>
    <q-card-actions class="q-px-lg">
      <q-btn unelevated size="lg" color="purple-4" class="full-width text-white" label="Login" @click="onSubmit" />
    </q-card-actions>
    <div class="text-center q-pa-md">
      <q-btn
        flat
        label="Don't have an account?"
        @click="emit('noAccount')"
      />
    </div>
  </div>
</template>

<!-- eslint-disable no-unused-vars -->
<script setup>
import { useAuthStore } from "src/stores/useAuthStore";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { Notify } from 'quasar';


const emit = defineEmits(['noAccount']);
const validationSchema = yup.object({
  username: yup.string()
               .min(5, "Username must be at least 6 characters long")
               .required("User ID is required"),
  password: yup.string()
               .min(8, "Password must be at least 8 characters long").required("Password is required"),
});

const { handleSubmit, defineField } = useForm({ validationSchema });

const appAuthStore = useAuthStore();

const quasarConfig = (state) => ({
  props: {
    error: !!state.errors[0],
    'error-message': state.errors[0],
  },
});


const [username, usernameAttrs] = defineField('username', quasarConfig);
const [password, passwordAttrs] = defineField('password', quasarConfig);

const onSubmit = handleSubmit(values => {
  appAuthStore.login(values.username, values.password).then(
    () => {
      if (appAuthStore.error != "") {
        Notify.create({
          color: "red-5",
          textColor: "white",
          icon: "warning",
          message: appAuthStore.error,
        });
      }
    }
  )
});
</script>
