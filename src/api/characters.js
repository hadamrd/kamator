import BaseCrudApi from './BaseCrudApi';

class CharactersApi extends BaseCrudApi {
  constructor() {
    super('/characters', 'characters');
  }
}

const charactersApiInstance = new CharactersApi();
export default charactersApiInstance;
