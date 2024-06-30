// src/api/BaseCrudApi.js
import { api } from 'src/boot/axios';
import { useQuery } from "@tanstack/vue-query";
import { queryClient } from 'src/boot/vue-query';

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
      this.updateCacheOnUpdate(response.data);
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

  // Utility methods to update the cache
  updateCacheOnAdd(newItem) {
    queryClient.setQueryData([this.cacheKey, 'all'], (oldData) => {
      if (!oldData) {
        return [newItem];
      }

      const existingIndex = oldData.findIndex(item => item.id === newItem.id);
      if (existingIndex !== -1) {
        // Update existing item
        oldData[existingIndex] = newItem;
        return [...oldData];
      } else {
        // Add new item
        return [...oldData, newItem];
      }
    });
  }

  updateCacheOnUpdate(updatedItem) {
    queryClient.setQueryData([this.cacheKey, 'all'], (oldData) => {
      return oldData ? oldData.map(item => item.id === updatedItem.id ? updatedItem : item) : [updatedItem];
    });
  }

  updateCacheOnDelete(id) {
    queryClient.setQueryData([this.cacheKey, 'all'], (oldData) => {
      return oldData ? oldData.filter(item => item.id !== id) : [];
    });
  }

  useGetItems() {
    return useQuery({
      queryKey: [this.cacheKey, 'all'],
      queryFn: async () => {
        const data = await this.getItems();
        return data;
      }
    });
  }

  useGetItem(itemId) {
    return useQuery({
      queryKey: [this.cacheKey, itemId],
      queryFn: async () => {
        const data = await this.getItem(itemId);
        return data;
      }
    });
  }
}

export default BaseCrudApi;
