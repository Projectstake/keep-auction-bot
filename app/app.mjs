import { DepositStore } from "./models/DepositStore.mjs";
export const depositStore = new DepositStore();

import { deployContracts } from "./contracts.mjs";

import { Bot } from "./models/Bot.mjs";
export const bot = new Bot(await deployContracts());
