<template>
  <q-page class="row items-stretch">
    <div class="col-2 column items-center justify-center">
      <div class="column items-center full-height">
        <q-card square class="full-height shadow-24" style="width: 500px; overflow: auto">
          <q-tabs v-model="tab" align="justify" class="bg-deep-purple-7 text-white" narrow-indicator>
            <q-tab name="login" label="Login" />
            <q-tab name="signup" label="SignUp" />
          </q-tabs>
          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="login">
              <LoginForm @no-account="tab = 'signup'" />
            </q-tab-panel>
            <q-tab-panel name="signup">
              <SignupForm @has-account="tab = 'login'" @signed-up="tab = 'login'" />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
    <div class="col-10" :style="{
      backgroundImage: `url(${loginBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }"></div>
  </q-page>
</template>

<script lang="ts">
import { ref } from "vue";
import LoginForm from "components/auth/LoginForm.vue";
import SignupForm from "components/auth/SignupForm.vue";
import loginBackground from 'src/assets/kamator_logging.png';

export default {
  name: "LoginPage",
  components: {
    LoginForm,
    SignupForm
  },
  setup() {
    return {
      tab: ref("login"),
      loginBackground
    };
  }
};
</script>
