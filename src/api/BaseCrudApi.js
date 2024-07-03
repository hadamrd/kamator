// src/api/BaseCrudApi.js
import { api } from "src/boot/axios";
import { useQuery } from "@tanstack/vue-query";
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

  async addItem(item) {
    const response = await api.post(`${this.endpoint}/`, item);
    if (response.status === 201 || response.status === 200) {
      this.updateCacheOnAdd(response.data);
    }
    return response.data;
  }

  async updateItem(id, newItem) {
    const response = await api.put(`${this.endpoint}/${id}`, newItem);
    if (response.status === 200) {
      this.updateCacheOnUpdate(id, newItem);
    }
    return response.data;
  }

  async deleteItem(id) {
    const response = await api.delete(`${this.endpoint}/${id}`);
    if (response.status === 204) {
      this.updateCacheOnDelete(id);
    }
    return response.data;
  }

  updateCacheOnAdd(newItem) {
    queryClient.setQueryData([this.cacheKey, newItem.id], newItem);
    const allItems = queryClient.getQueryData([this.cacheKey, 'all']);
    if (allItems) {
      queryClient.setQueryData([this.cacheKey, 'all'], [...allItems, newItem]);
    }
  }

  async updateCacheOnUpdate(itemId, newData) {
    let updatedItem = queryClient.getQueryData([this.cacheKey, itemId]);
    if (!updatedItem) {
      updatedItem = await this.getItem(itemId);
    } else {
      updatedItem = { ...updatedItem, ...newData };
    }
    queryClient.setQueryData([this.cacheKey, itemId], newData);
    const allItems = queryClient.getQueryData([this.cacheKey, 'all']);
    if (allItems) {
      const itemIndex = allItems.findIndex((it) => it && it.id === itemId);
      if (itemIndex > -1) {
        const newData = [...allItems];
        newData[itemIndex] = updatedItem;
        queryClient.setQueryData([this.cacheKey, 'all'], newData);
      } else {
        queryClient.setQueryData([this.cacheKey, 'all'], [...allItems, updatedItem]);
      }
    }
  }

  updateCacheOnDelete(id) {
    queryClient.invalidateQueries([this.cacheKey, id]);
    queryClient.setQueryData([this.cacheKey, "all"], (oldData) => {
      return oldData ? oldData.filter((item) => item.id !== id) : [];
    });
  }

  useGetItems() {
    return useQuery({
      queryKey: [this.cacheKey, "all"],
      queryFn: async () => {
        const data = await this.getItems();
        data.forEach((item) => {
          queryClient.setQueryData([this.cacheKey, item.id], item);
        });
        return data;
      },
    });
  }

  useGetItem(itemId) {
    return useQuery({
      queryKey: [this.cacheKey, itemId],
      queryFn: async () => {
        return await this.getItem(itemId);
      },
    });
  }

  clearAllCache() {
    queryClient.invalidateQueries({ queryKey: this.cacheKey });
  }
}

export default BaseCrudApi;
