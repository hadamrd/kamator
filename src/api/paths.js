import BaseCrudApi from "./BaseCrudApi";

class PathsApi extends BaseCrudApi {
  constructor() {
    super("/paths", "paths");
  }

  async getPathsTypeChoices() {
    return useQuery({
      queryKey: [this.cacheKey, "type_choices"],
      queryFn: async () => {
        return await api.get(`/${this.endpoint}/type_choices/`);
      },
    });
  }
}

const pathsApiInstance = new PathsApi();
export default pathsApiInstance;
