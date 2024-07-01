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
