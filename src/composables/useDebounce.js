// src/composables/useDebounce.js
import { ref, onUnmounted } from 'vue';

export const useDebounce = () => {
  const timeoutIds = ref(new Map());

  onUnmounted(() => {
    // Clean up any remaining timeouts
    timeoutIds.value.forEach(id => clearTimeout(id));
    timeoutIds.value.clear();
  });

  const debounce = (fn, wait = 300) => {
    const timeoutKey = Symbol();

    return (...args) => {
      // Clear previous timeout for this function
      if (timeoutIds.value.has(timeoutKey)) {
        clearTimeout(timeoutIds.value.get(timeoutKey));
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        fn(...args);
        timeoutIds.value.delete(timeoutKey);
      }, wait);

      timeoutIds.value.set(timeoutKey, timeoutId);
    };
  };

  return {
    debounce
  };
};
