import { api } from "src/boot/axios";
import BaseCrudApi from "./BaseCrudApi";
import charactersApiInstance from "./characters";

class AccountsApi extends BaseCrudApi {
  constructor() {
    super("/accounts", "accounts");
  }

  async addWithCode(data) {
    const response = await api.post(`${this.endpoint}/add_account/`, data);
    if (response.status === 200 && response.data.account) {
      this.invalidateList();
      this.invalidateItem(response.data.account.id);
    }
    return response;
  }

  async securityCode(code, accountId) {
    const response = await api.post(`${this.endpoint}/security_code/`, {
      code,
      accountId,
    });
    if (response.status === 200) {
      this.invalidateList();
      this.invalidateItem(accountId);
    }
    return response;
  }

  async fetchCharacters(accountId) {
    const response = await api.post(
      `${this.endpoint}/${accountId}/fetch_characters/`
    );
    if (response.status === 200) {
      charactersApiInstance.invalidateList();
      if (Array.isArray(response.data.characters)) {
        response.data.characters.forEach((character) => {
          if (character && character.id) {
            charactersApiInstance.invalidateItem(character.id);
          }
        });
      }
    }
    return response;
  }

  async quickCharacterCreate(accountId, serverId) {
    const response = await api.post(
      `${this.endpoint}/${accountId}/quick_character_create/`,
      { serverId }
    );
    if (response.status === 200) {
      charactersApiInstance.invalidateList();
      charactersApiInstance.invalidateItem(response.data.character.id);
    }
    return response;
  }

  async setNickname(accountId, nickname) {
    const response = await api.post(
      `${this.endpoint}/${accountId}/set_nickname/`,
      { nickname }
    );
    if (response.status === 200) {
      this.invalidateList();
      this.invalidateItem(accountId);
    }
    return response;
  }
}

// Export a single instance of the AccountsApi class
const accountsApiInstance = new AccountsApi();
export default accountsApiInstance;
