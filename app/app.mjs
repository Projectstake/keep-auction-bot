import { DepositStore } from "./models/DepositStore.mjs";
export const depositStore = new DepositStore();

import { AuctionStore } from "./models/AuctionStore.mjs";
export const auctionStore = new AuctionStore();

import { deployContracts } from "./contracts.mjs";

import { Bot } from "./models/Bot.mjs";
export const bot = new Bot(await deployContracts());
