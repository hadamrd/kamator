import { api } from 'src/boot/axios';
import BaseCrudApi from './BaseCrudApi';
import charactersApiInstance from './characters';

class AccountsApi extends BaseCrudApi {
  constructor() {
    super('/accounts', 'accounts'); // Pass the endpoint to the base class
  }

  async addWithCode(data) {
    const response = await api.post(`${this.endpoint}/add_account/`, data);
    if (response.status === 200 && response.data.account) {
      this.updateCacheOnAdd(response.data.account);
    }
    return response.data;
  }

  async securityCode(code, accountId) {
    const response = await api.post(`${this.endpoint}/security_code/`, { code, accountId });
    if (response.status === 200 && response.data.account) {
      this.updateCacheOnAdd(response.data.account);
    }
    return response.data;
  }

  async fetchCharacters(accountId) {
    const response = await api.post(`${this.endpoint}/${accountId}/fetch_characters/`);
    if (response.status == 200) {
      const characters  = response.data.characters;
      for (const character of characters) {
        charactersApiInstance.updateCacheOnAdd(character);
      }
      this.updateCacheOnAdd(response.data.account);
    }
    return response;
  }

  async setNickname(accountId, nickname) {
    const response = await api.post(`${this.endpoint}/${accountId}/set_nickname/`, { nickname });
    if (response.status == 200) {
      this.updateCacheOnAdd(response.data.account);
    }
    return response;
  }
}

// Export a single instance of the AccountsApi class
const accountsApiInstance = new AccountsApi();
export default accountsApiInstance;
