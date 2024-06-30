import { useMutation, useQuery } from "@tanstack/vue-query";
import { queryClient } from "src/boot/vue-query";
import { ACCOUNTS, CHARACTERS } from "src/constants/queryKeys";
import accountsApiInstance from "./account";
import charactersApiInstance from "./characters";

// Fetch accounts query
export const fetchAccountsQuery = () => {
  return useQuery({
    queryKey: [ACCOUNTS, 'all'],
    queryFn: async () => {
      const data = await accountsApiInstance.getItems();
      return data;
    }
  });
}

export const useAddAccountMutation = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await accountsApiInstance.add_account(data);
      return response;
    },
    onSuccess: (newAccount) => {
      // Update the accounts query data with the new account
      queryClient.setQueryData([ACCOUNTS, 'all'], (oldData) => {
        return [...oldData, newAccount];
      });
    }
  });
};

// Fetch accounts query
export const fetchCharactersQuery = () => {
  return useQuery({
    queryKey: [CHARACTERS, 'all'],
    queryFn: async () => {
      const data = await charactersApiInstance.getItems();
      return data;
    }
  });
}

// Delete account mutation
export const deleteAccountMutation = () => {
  return useMutation({
    mutationFn: async (item) => {
      return await accountsApiInstance.deleteItem(item.id);
    },
    onSuccess: () => {
      // Invalidate the accounts query to refetch data
      queryClient.invalidateQueries([ACCOUNTS, 'all']);
    }
  });
}

export const validateSecurityCodeMutation = () => {
  return useMutation({
    mutationFn: async ({ code, accountId }) => {
      const updatedAccount = await accountsApiInstance.securityCode(code, accountId);
      return updatedAccount;
    },
    onSuccess: (updatedAccount) => {
      // Update the specific account in the cache
      queryClient.setQueryData([ACCOUNTS, 'all'], (oldData) => {
        if (!oldData) return [updatedAccount];
        return oldData.map(account =>
          account.id === updatedAccount.id ? updatedAccount : account
        );
      });
    }
  });
}
