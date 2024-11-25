<template>
  <div class="q-pl-md">
      <div class="row justify-center text-h6 text-purple-4 q-mb-md">
          Kamator
      </div>
      <q-form class="q-px-md q-pt-xl q-pb-lg">
          <q-input v-model="first_name" v-bind="firstNameAttrs" square clearable type="text" label="First Name *"
              class="q-my-md">
              <template #prepend>
                  <q-icon name="person" />
              </template>
          </q-input>
          <q-input v-model="last_name" v-bind="lastNameAttrs" square clearable type="text" label="Last Name *"
              class="q-my-md">
              <template #prepend>
                  <q-icon name="person" />
              </template>
          </q-input>
          <q-input v-model="email" v-bind="emailAttrs" square clearable type="email" label="Your email *"
              class="q-my-md">
              <template #prepend>
                  <q-icon name="email" />
              </template>
          </q-input>
          <q-input v-model="username" v-bind="usernameAttrs" square clearable type="text" label="Username"
              class="q-my-md">
              <template #prepend>
                  <q-icon name="person" />
              </template>
          </q-input>
          <q-input v-model="password" v-bind="passwordAttrs" square clearable type="password" label="Password"
              class="q-my-md">
              <template #prepend>
                  <q-icon name="lock" />
              </template>
          </q-input>
          <q-input v-model="password2" v-bind="password2Attrs" square clearable type="password"
              label="Confirm Password" class="q-my-md">
              <template #prepend>
                  <q-icon name="lock" />
              </template>
          </q-input>
      </q-form>
      <q-btn unelevated size="lg" color="purple-4" class="full-width text-white" label="SignUp" :disable="!meta.valid"
          @click="onSubmit" />
      <div class="text-center q-pa-md">
          <q-btn flat label="Already have an account?" @click="emit('hasAccount')" />
      </div>
  </div>
</template>

<!-- eslint-disable no-unused-vars -->
<script setup>
import * as yup from "yup";
import { useUserStore } from "../../stores/users";
import { useForm } from "vee-validate";
import { Notify } from 'quasar';

const emit = defineEmits(['signedUp', 'hasAccount']);

const schema = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  username: yup.string().min(5, "Username must be at least 5 characters long").required("Username is required"),
  password: yup.string().min(8, "Password must be at least 8 characters long").required("Password is required"),
  password2: yup.string().oneOf([yup.ref('password'), null], "Passwords must match").required("Confirm Password is required")
});

const { handleSubmit, defineField, meta, setFieldError } = useForm({ validationSchema: schema });
const userStore = useUserStore();

const quasarConfig = (state) => ({
  props: {
      error: !!state.errors[0],
      'error-message': state.errors[0],
  },
});

const [first_name, firstNameAttrs] = defineField('first_name', quasarConfig);
const [last_name, lastNameAttrs] = defineField('last_name', quasarConfig);
const [email, emailAttrs] = defineField('email', quasarConfig);
const [username, usernameAttrs] = defineField('username', quasarConfig);
const [password, passwordAttrs] = defineField('password', quasarConfig);
const [password2, password2Attrs] = defineField('password2', quasarConfig);

const onSubmit = handleSubmit(async (values) => {
  console.log("values")
  if (!meta.value.valid) {
      Notify.create({
          color: "red-5",
          textColor: "white",
          icon: "warning",
          message: "Please correct the errors before submitting.",
      });
      return;
  }
  try {
      await userStore.signup(values);
      Notify.create({
          color: "green-4",
          textColor: "white",
          icon: "thumb_up",
          message: "Registration successful",
      });
      emit('signedUp');
  } catch (error) {
      if (error?.response?.data) {
          const serverErrors = error.response.data;
          for (const field in serverErrors) {
              setFieldError(field, String(serverErrors[field][0]))
          }
      }
  }
});

</script>
