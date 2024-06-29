<!-- eslint-disable vue/no-unused-vars -->
<template>
  <q-card class="q-pa-md">
    <q-btn color="primary" label="Authenticate" @click="authenticate" />
    <q-list class="q-pa-md q-ma-md" bordered>
      <q-expansion-item v-for="account in accountStore.accounts" :key="account.id" expand-separator
        :label="account.login" :caption="account.nickname">
        <template v-slot:header>
          <q-item-section avatar>
            <q-avatar size="45px">
              <img :src="account.avatar" alt="User Avatar">
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ account.login }}</q-item-label>
            <q-item-label caption>{{ account.nickname }}</q-item-label>
          </q-item-section>
        </template>
        <q-list>
          <q-item v-for="character in accountStore.getAccountCharacters(account.id)" :key="character.id"
            class="row items-center" clickable>
            <q-item-section avatar>
              <q-avatar size="60px">
                <img :src="getCharacterAvatar(character.breedId)" alt="Character Avatar">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ character.name }}</q-item-label>
              <q-item-label caption>{{ character.serverName }}</q-item-label>
            </q-item-section>
            <q-item-section class="col-auto">
              <div>
                <q-btn flat label="Farm" @click="quickRunFarm(account.id, character.id)" icon="eco" />
                <q-btn flat label="TreasureHunt" @click="quickRunTreasureHunt(account.id, character.id)"
                  icon="explore" />
                <q-btn flat label="Fight" @click="quickRunFight(account.id, character.id)" icon="sports_martial_arts" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>
    </q-list>
  </q-card>
  <SecurityCodeInput v-model="showSecurityCodeDialog"/>
</template>

<script>
import { ref } from 'vue';
import { useAccountStore } from 'stores/accounts';
import { useSessionStore } from 'stores/sessions';
import { useGlobalStore } from 'stores/globalVuesStore'
import SecurityCodeInput from 'components/forms/SecurityCodeInput.vue';
import { api } from 'boot/axios';

export default {
  name: 'AccountsView',
  components: {
    SecurityCodeInput
  },
  setup() {
    const accountStore = useAccountStore();
    const sessionStore = useSessionStore();
    const globalStore = useGlobalStore();
    globalStore.header = 'Accounts';
    const visibleCharacters = ref({});

    return {
      accountStore,
      visibleCharacters,
      sessionStore,
      showSecurityCodeDialog: ref(false)
    };
  },
  async created() {
    await this.accountStore.getAccounts();
    await this.accountStore.getCharacters();
  },
  methods: {
    toggleCharacters(accountId) {
      this.visibleCharacters[accountId] = !this.visibleCharacters[accountId];
    },
    quickRunTreasureHunt(accountId, characterId) {
      console.log('TreasureHunt dialog opened', accountId, 'and character', characterId);
      // Logic to open the treasure hunt dialog
    },
    quickRunFight(accountId, characterId) {
      console.log('Fight form dialog opened for account', accountId, 'and character', characterId);
      // Logic to open the fight dialog
    },
    quickRunFarm(accountId, characterId) {
      console.log('Farm form dialog opened for account', accountId, 'and character', characterId);
      // Logic to open the farm dialog
    },
    getCharacterAvatar(breedId) {
      return new URL(`/src/assets/classes/symbol_${breedId}.png`, import.meta.url).href
    },
    getAccountCharacters(accountId) {
      return this.accountStore.getAccountCharacters(accountId);
    },
    handleValidationSuccess(data) {
      this.showSecurityCodeDialog = false;
    },
    async authenticate() {
      try {
        const data = await window.electronAPI.startAuth();
        const response = await api.post('/accounts/add_account/', data);
        console.log(response.data);
        if (response.data.code_sent) {
          this.showSecurityCodeDialog = true;
        }
      } catch (error) {
        console.error('Error during authentication:', error);
      }
    }
  }
};
</script>

<style scoped></style>
