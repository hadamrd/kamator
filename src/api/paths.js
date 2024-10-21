import BaseCrudApi from "./BaseCrudApi";
import { useQuery } from "@tanstack/vue-query";
import { api } from "src/boot/axios";

class PathsApi extends BaseCrudApi {
  constructor() {
    super("/paths", "paths");
  }

  async getPathsTypeChoices() {
    const response = await api.get(`${this.endpoint}/type_choices/`);
    return response.data;
  }

  useGetPathsTypeChoices() {
    return useQuery({
      queryKey: [this.cacheKey, "type_choices"],
      queryFn: () => this.getPathsTypeChoices(),
    });
  }
}

const pathsApiInstance = new PathsApi();
export default pathsApiInstance;
