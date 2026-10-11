/**
 * Compile-time check that @eventuras/historia-sdk still matches this collection.
 *
 * The SDK has its own types, so a change here does not change its public API. That
 * also means renaming or retyping a field the SDK reads would not break its build,
 * only make the field quietly empty on the sites that use it. This file fails the
 * typecheck instead. If it does, update packages/historia-sdk/src/products.ts (and
 * release a new SDK version) together with the schema change.
 *
 * Types only: nothing here runs or is bundled.
 */

import type { Media, Product } from '@/payload-types';
import type {
  POPULATE,
  RawMedia,
  RawProduct,
  SELECT,
} from '../../../../../packages/historia-sdk/src/products';

type Fits<Actual extends Expected, Expected> = Actual;

/** Every field the SDK selects is a product field, and Payload's answer fits the SDK's raw type. */
export type SdkProductContract = Fits<Pick<Product, 'id' | keyof typeof SELECT>, RawProduct>;

/** Every media field the SDK populates exists, and fits the SDK's raw media type. */
export type SdkMediaContract = Fits<Pick<Media, keyof typeof POPULATE.media>, RawMedia>;
