// SessionStatusEnum equivalent in JavaScript
export const SessionStatusEnum = {
  CRASHED: "CRASHED",
  TERMINATED: "TERMINATED",
  RUNNING: "RUNNING",
  DISCONNECTED: "DISCONNECTED",
  AUTHENTICATING: "AUTHENTICATING",
  FIGHTING: "FIGHTING",
  ROLEPLAYING: "ROLEPLAYING",
  LOADING_MAP: "LOADING_MAP",
  PROCESSING_MAP: "PROCESSING_MAP",
  OUT_OF_ROLEPLAY: "OUT_OF_ROLEPLAY",
  IDLE: "IDLE",
  BANNED: "BANNED",
  STARTING: "STARTING",
  DOWN: "DOWN",
};

// SessionTypeEnum equivalent in JavaScript
export const SessionTypeEnum = {
  SOLO_FIGHT: "SOLO_FIGHT",
  GROUP_FIGHT: "GROUP_FIGHT",
  MULE_FIGHT: "MULE_FIGHT",
  FARM: "FARM",
  MULTIPLE_PATHS_FARM: "MULTIPLE_PATHS_FARM",
  SELL: "SELL",
  TREASURE_HUNT: "TREASURE_HUNT",
  MIXED: "MIXED",
};

// UnloadTypeEnum equivalent in JavaScript
export const UnloadTypeEnum = {
  BANK: "BANK",
  STORAGE: "STORAGE",
  SELLER: "SELLER",
};

// PathTypeEnum equivalent in JavaScript
export const PathTypeEnum = {
  RandomSubAreaFarmPath: "RandomSubAreaFarmPath",
  RandomAreaFarmPath: "RandomAreaFarmPath",
  CyclicFarmPath: "CyclicFarmPath",
  CustomRandomFarmPath: "CustomRandomFarmPath",
};

export const sessionTypesChoices = [
  {
    value: SessionTypeEnum.SOLO_FIGHT,
    label: "Solo Fight",
  },
  {
    value: SessionTypeEnum.GROUP_FIGHT,
    label: "Group Fight",
  },
  {
    value: SessionTypeEnum.FARM,
    label: "Farm",
  },
  {
    value: SessionTypeEnum.SELL,
    label: "Sell",
  },
  {
    value: SessionTypeEnum.TREASURE_HUNT,
    label: "Treasure Hunt",
  },
  {
    value: SessionTypeEnum.MIXED,
    label: "Mixed",
  },
  {
    value: SessionTypeEnum.MULE_FIGHT,
    label: "Mule Fight",
  },
  {
    value: SessionTypeEnum.MULTIPLE_PATHS_FARM,
    label: "Multiple Paths Farm",
  },
];

export const sessionUnloadTypeChoices = [
  {
    value: UnloadTypeEnum.BANK,
    label: "unload in bank",
  },
  {
    value: UnloadTypeEnum.SELLER,
    label: "unload in seller",
  },
  {
    value: UnloadTypeEnum.STORAGE,
    label: "unload in storage",
  },
];
