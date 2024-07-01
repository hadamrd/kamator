<template>
  <q-card class="q-pa-md">
    <q-btn color="primary" label="Add account" @click="newAccount" />

    <!-- Loading and Error States for Accounts -->
    <div v-if="isAccountsLoading">
      <q-spinner color="primary" />
    </div>
    <div v-else-if="isAccountsError">
      <q-banner dense>
        <template v-slot:action>
          <q-btn flat label="Retry" @click="refetchAccounts" />
        </template>
        {{ accountsError.message }}
      </q-banner>
    </div>

    <!-- Loading and Error States for Characters -->
    <div v-if="isCharactersLoading">
      <q-spinner color="primary" />
    </div>
    <div v-else-if="isCharactersError">
      <q-banner dense>
        <template v-slot:action>
          <q-btn flat label="Retry" @click="refetchCharacters" />
        </template>
        {{ charactersError.message }}
      </q-banner>
    </div>

    <!-- Accounts and Characters List -->
    <q-list v-else class="q-pa-md q-ma-md" bordered>
      <q-expansion-item
        v-for="account in accounts"
        :key="account.id"
        expand-separator
        :label="account.login"
        :caption="account.nickname"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-avatar size="45px">
              <img :src="account.avatar" alt="User Avatar" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ account.login }}</q-item-label>
            <q-item-label caption>{{ account.nickname }}</q-item-label>
          </q-item-section>
          <q-item-section class="col-auto">
            <q-btn-group push>
              <q-btn flat icon="add" @click="quickBotCreate(account)">
                <q-tooltip>Quick bot create</q-tooltip>
              </q-btn>
              <q-btn flat icon="visibility" @click="viewAccount(account.id)">
                <q-tooltip>View Account</q-tooltip>
              </q-btn>
              <q-btn flat icon="delete" @click="deleteAccount(account.id)">
                <q-tooltip>Delete Account</q-tooltip>
              </q-btn>
              <q-btn
                flat
                icon="sync"
                v-if="!fetchingAccounts[account.id]"
                @click="fetchCharacters(account)"
              >
                <q-tooltip>Fetch Characters</q-tooltip>
              </q-btn>
              <q-spinner round size="sm" v-else color="primary" />
            </q-btn-group>
          </q-item-section>
        </template>
        <q-list>
          <q-item
            v-for="character in getAccountCharacters(account.id)"
            :key="character.id"
            class="row items-center"
            clickable
          >
            <q-item-section avatar>
              <q-avatar size="60px">
                <img
                  :src="getCharacterAvatar(character.breedId)"
                  alt="Character Avatar"
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ character.name }}</q-item-label>
              <q-item-label caption>{{ character.serverName }}</q-item-label>
            </q-item-section>
            <q-item-section class="col-auto">
              <div>
                <q-btn
                  flat
                  icon="eco"
                  @click="quickRunFarm(account.id, character.id)"
                >
                  <q-tooltip>Farm</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  icon="explore"
                  @click="quickRunTreasureHunt(account.id, character.id)"
                >
                  <q-tooltip>Treasure Hunt</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  icon="sports_martial_arts"
                  @click="quickRunFight(account.id, character.id)"
                >
                  <q-tooltip>Fight</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>
    </q-list>
    <SecurityCodeInput
      v-model="showSecurityCodeDialog"
      :accountId="selectedAccount.id"
      @success="onSecurityCodeSuccess()"
    />
    <QuickBotCreateDialog
      v-model="showQuickBotCreateDialog"
      :accountId="selectedAccount.id"
      @doubleAuth="(response) => checkDoubleAuth(selectedAccount, response)"
    />
    <NicknameDialog
      v-model="showNicknameDialog"
      :accountId="selectedAccount.id"
      :accountLogin="selectedAccount.login"
      @doubleAuth="(response) => checkDoubleAuth(selectedAccount, response)"
    />
  </q-card>
</template>

<script>
import { ref } from "vue";
import { useGlobalStore } from "stores/globalVuesStore";
import SecurityCodeInput from "components/forms/SecurityCodeInput.vue";
import QuickBotCreateDialog from "components/forms/QuickBotCreateDialog.vue";
import NicknameDialog from "components/forms/NicknameDialog.vue";
import accountsApiInstance from "src/api/account";
import charactersApiInstance from "src/api/characters";
import { Notify } from "quasar";

export default {
  name: "AccountsView",
  components: {
    SecurityCodeInput,
    NicknameDialog,
    QuickBotCreateDialog,
  },
  setup() {
    const globalStore = useGlobalStore();
    globalStore.header = "Accounts";

    const {
      isLoading: isAccountsLoading,
      data: accounts,
      isError: isAccountsError,
      error: accountsError,
      refetch: refetchAccounts,
    } = accountsApiInstance.useGetItems();

    const {
      isLoading: isCharactersLoading,
      data: characters,
      isError: isCharactersError,
      error: charactersError,
      refetch: refetchCharacters,
    } = charactersApiInstance.useGetItems();

    const showSecurityCodeDialog = ref(false);
    const selectedAccount = ref({ id: 0, login: "" });
    const fetchingAccounts = ref({});
    const showNicknameDialog = ref(false);
    const showQuickBotCreateDialog = ref(false);

    const getAccountCharacters = (accountId) => {
      if (!characters.value) return [];
      return characters.value.filter(
        (character) => character.account === accountId
      );
    };

    const newAccount = async () => {
      try {
        const data = await window.electronAPI.startAuth();
        const response = await accountsApiInstance.addWithCode(data);
        selectedAccount.value = response.data.account;
        if (response.data.code_sent) {
          showSecurityCodeDialog.value = true;
        }
      } catch (error) {
        console.error("Error during authentication:", error);
      }
    };

    const viewAccount = (accountId) => {
      console.log("View account", accountId);
      // Logic to view account details
    };

    const deleteAccount = async (accountId) => {
      try {
        await accountsApiInstance.delete(accountId);
        refetchAccounts(); // Refresh the account list
        Notify.create({
          type: "positive",
          message: "Account deleted successfully!",
          timeout: 1000,
        });
      } catch (error) {
        console.error("Error deleting account:", error);
        Notify.create({
          type: "negative",
          message: "Error deleting account: " + error.message,
          timeout: 1000,
        });
      }
    };

    const quickBotCreate = async (account) => {
      selectedAccount.value = account;
      showQuickBotCreateDialog.value = true;
    };

    const checkDoubleAuth = (account, response) => {
      if (response.data.double_auth) {
        if (response.data.code_sent) {
          selectedAccount.value = account;
          showNicknameDialog.value = false;
          showQuickBotCreateDialog.value = false;
          showSecurityCodeDialog.value = true;
        } else {
          Notify.create({
            type: "negative",
            message: response.data.message,
            timeout: 1000,
          });
        }
      }
    };

    const fetchCharacters = async (account) => {
      try {
        fetchingAccounts.value[account.id] = true;
        console.log("Fetch characters for account", account.id);
        const response = await accountsApiInstance.fetchCharacters(account.id);
        if (response.data.double_auth) {
          checkDoubleAuth(account, response);
        }
      } catch (error) {
        console.error("Error fetching characters:", error);
        Notify.create({
          type: "negative",
          message: "Error: " + error.response.data.message,
          timeout: 1000,
        });
        if (error.response.data.need_nickname) {
          selectedAccount.value = account;
          showSecurityCodeDialog.value = false;
          showNicknameDialog.value = true;
        }
      } finally {
        fetchingAccounts.value[account.id] = false;
      }
    };

    return {
      showSecurityCodeDialog,
      selectedAccount,
      accounts,
      isAccountsLoading,
      isAccountsError,
      accountsError,
      refetchAccounts,
      isCharactersLoading,
      isCharactersError,
      charactersError,
      refetchCharacters,
      getAccountCharacters,
      fetchingAccounts,
      viewAccount,
      deleteAccount,
      fetchCharacters,
      showNicknameDialog,
      quickBotCreate,
      showQuickBotCreateDialog,
      newAccount,
      checkDoubleAuth,
    };
  },
  methods: {
    quickRunTreasureHunt(accountId, characterId) {
      console.log(
        "TreasureHunt dialog opened",
        accountId,
        "and character",
        characterId
      );
      // Logic to open the treasure hunt dialog
    },
    quickRunFight(accountId, characterId) {
      console.log(
        "Fight form dialog opened for account",
        accountId,
        "and character",
        characterId
      );
      // Logic to open the fight dialog
    },
    quickRunFarm(accountId, characterId) {
      console.log(
        "Farm form dialog opened for account",
        accountId,
        "and character",
        characterId
      );
      // Logic to open the farm dialog
    },
    getCharacterAvatar(breedId) {
      return new URL(
        `/src/assets/classes/symbol_${breedId}.png`,
        import.meta.url
      ).href;
    },
    onSecurityCodeSuccess() {
      this.showSecurityCodeDialog = false;
      this.showNicknameDialog = true;
    },
  },
};
</script>
