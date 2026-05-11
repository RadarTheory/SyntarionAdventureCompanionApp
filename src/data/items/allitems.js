import { CURRENCY } from './currency';
import { WEAPONS } from './weapons';
import { ARMOR } from './armor';
import { GEAR } from './gear';
import { PACKS } from './packs';
import { COMPANION } from './companion';
import { CONSUMABLES } from './consumables';
import { SPELLCASTING_ITEMS } from './spellcastingItems';
import { SCHEMATIC_MATERIALS } from './schematicMaterials';
import { DOCUMENTS } from './documents';
import { MAGIC_ITEMS } from './magicItems';
import { ARTIFACTS } from './artifacts';
import { BLACK_MARKET_ITEMS } from './blackmarket';
import { TRADE_GOODS } from "./tradegoods";
import { COLLECTABLES } from "./collectables";

export const ALL_ITEMS = [
  ...CURRENCY,
  ...WEAPONS,
  ...ARMOR,
  ...GEAR,
  ...PACKS,
  ...COMPANION,
  ...CONSUMABLES,
  ...SPELLCASTING_ITEMS,
  ...SCHEMATIC_MATERIALS,
  ...DOCUMENTS,
  ...MAGIC_ITEMS,
  ...ARTIFACTS,
  ...BLACK_MARKET_ITEMS,
  ...TRADE_GOODS,
  ...COLLECTABLES
];