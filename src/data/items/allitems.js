// src/data/items/allItems.js

import { CURRENCY } from './currency';
import { WEAPONS } from './weapons';
import { ARMOR } from './armor';
import { GEAR } from './gear';
import { PACKS } from './packs';
import { COMPANION } from './companion';
import { TRADE_GOODS } from './tradeGoods';
import { TRINKETS } from './trinkets';
import { CONSUMABLES } from './consumables';
import { SPELLCASTING_ITEMS } from './spellcastingItems';
import { SCHEMATIC_MATERIALS } from './schematicMaterials';
import { DOCUMENTS } from './documents';
import { MAGIC_ITEMS } from './magicItems';
import { ARTIFACTS } from './artifacts';

export const ALL_ITEMS = [
  ...CURRENCY,
  ...WEAPONS,
  ...ARMOR,
  ...GEAR,
  ...PACKS,
  ...COMPANION,
  ...TRADE_GOODS,
  ...TRINKETS,
  ...CONSUMABLES,
  ...SPELLCASTING_ITEMS,
  ...SCHEMATIC_MATERIALS,
  ...DOCUMENTS,
  ...MAGIC_ITEMS,
  ...ARTIFACTS,
];