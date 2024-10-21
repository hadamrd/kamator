import { api } from "src/boot/axios";
import { useQuery, useMutation } from "@tanstack/vue-query";
import { queryClient } from "src/boot/vue-query";

class BaseCrudApi {
  constructor(endpoint, cacheKey) {
    if (!endpoint) {
      throw new Error("Endpoint must be defined");
    }
    this.endpoint = endpoint;
    this.cacheKey = cacheKey;
  }

  async getItems() {
    const response = await api.get(`${this.endpoint}/`);
    return response.data;
  }

  async getItem(itemId) {
    const response = await api.get(`${this.endpoint}/${itemId}`);
    return response.data;
  }

  invalidateItem(itemId) {
    queryClient.invalidateQueries([this.cacheKey, "detail", itemId]);
  }

  invalidateList() {
    queryClient.invalidateQueries([this.cacheKey, "list"]);
  }

  async addItem(item) {
    const response = await api.post(`${this.endpoint}/`, item);
    return response.data;
  }

  async updateItem(id, newItem) {
    const response = await api.put(`${this.endpoint}/${id}`, newItem);
    return response.data;
  }

  async deleteItem(id) {
    const response = await api.delete(`${this.endpoint}/${id}`);
    return response.data;
  }

  useGetItems() {
    return useQuery({
      queryKey: [this.cacheKey, "list"],
      queryFn: () => this.getItems(),
    });
  }

  useGetItem(itemId) {
    return useQuery({
      queryKey: [this.cacheKey, "detail", itemId],
      queryFn: () => this.getItem(itemId),
    });
  }

  useAddItem() {
    return useMutation({
      mutationFn: (newItem) => this.addItem(newItem),
      onSuccess: () => {
        this.invalidateList()
      },
    });
  }

  useUpdateItem() {
    return useMutation({
      mutationFn: ({ id, newItem }) => this.updateItem(id, newItem),
      onSuccess: (_) => {
        this.invalidateList()
        this.invalidateItem(id);
      },
    });
  }

  useDeleteItem() {
    return useMutation({
      mutationFn: (id) => this.deleteItem(id),
      onSuccess: (_, id) => {
        this.invalidateList()
        this.invalidateItem(id);
      },
    });
  }

  async updateCacheOnUpdate(itemId, newData) {
    let updatedItem = queryClient.getQueryData([this.cacheKey, "detail", itemId]);
    if (!updatedItem) {
        updatedItem = await this.getItem(itemId);
    } else {
        updatedItem = { ...updatedItem, ...newData };
    }

    // Ensure the individual item cache is updated
    queryClient.setQueryData([this.cacheKey, "detail", itemId], updatedItem);

    // Update the 'all' items cache
    const allItems = queryClient.getQueryData([this.cacheKey, 'list']);
    if (allItems) {
        const itemIndex = allItems.findIndex((it) => it && it.id === itemId);
        if (itemIndex > -1) {
            const newDataArray = [...allItems];
            newDataArray[itemIndex] = updatedItem;
            queryClient.setQueryData([this.cacheKey, 'list'], newDataArray);
        } else {
            queryClient.setQueryData([this.cacheKey, 'list'], [...allItems, updatedItem]);
        }
    }
  }
}

export default BaseCrudApi;
