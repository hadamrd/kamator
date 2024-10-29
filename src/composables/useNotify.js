// src/composables/useNotify.js
import { Notify } from 'quasar';

export const useNotify = () => {
  const notify = {
    success: (message, options = {}) => {
      Notify.create({
        type: 'positive',
        message,
        position: 'top',
        timeout: 2000,
        ...options,
      });
    },

    error: (message, options = {}) => {
      Notify.create({
        type: 'negative',
        message,
        position: 'top',
        timeout: 3000,
        actions: [
          { label: 'Dismiss', color: 'white' }
        ],
        ...options,
      });
    },

    warning: (message, options = {}) => {
      Notify.create({
        type: 'warning',
        message,
        position: 'top',
        timeout: 2500,
        ...options,
      });
    },

    info: (message, options = {}) => {
      Notify.create({
        type: 'info',
        message,
        position: 'top',
        timeout: 2000,
        ...options,
      });
    },

    // For persistent messages that require user action
    alert: (message, options = {}) => {
      Notify.create({
        type: 'warning',
        message,
        position: 'center',
        timeout: 0,
        actions: [
          { label: 'OK', color: 'white', handler: options.onOk }
        ],
        ...options,
      });
    },

    // For custom notifications
    custom: (config) => {
      Notify.create(config);
    },
  };

  return {
    notify
  };
};
