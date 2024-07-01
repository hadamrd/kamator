import BaseCrudApi from "./BaseCrudApi";

class DofusDataApi extends BaseCrudApi {
  constructor() {
    super("/dofus-data", "dofus-data");
  }
}

const dofusDataApiInstance = new DofusDataApi();
export default dofusDataApiInstance;
