/**
 * Compile-time check that @eventuras/historia-sdk still matches the notes collection.
 *
 * As for products (Products/sdk-contract.ts): the SDK has its own types, so renaming
 * or retyping a field it reads would not break its build, only make the field quietly
 * empty on the sites that use it. This file fails the typecheck instead. If it does,
 * update packages/historia-sdk/src/notes.ts (and release a new SDK version) together
 * with the schema change.
 *
 * Types only: nothing here runs or is bundled.
 */

import type { Note, Topic } from '@/payload-types';
import type {
  NOTE_POPULATE,
  NOTE_SELECT,
  RawNote,
  RawTopic,
} from '../../../../packages/historia-sdk/src/notes';
import type { RawRichText } from '../../../../packages/historia-sdk/src/richtext';

type Fits<Actual extends Expected, Expected> = Actual;

/** Every field the SDK selects is a note field, and Payload's answer fits the SDK's raw type. */
export type SdkNoteContract = Fits<Pick<Note, 'id' | keyof typeof NOTE_SELECT>, RawNote>;

/** Every topic field the SDK populates exists, and fits the SDK's raw topic type. */
export type SdkTopicContract = Fits<
  Pick<Topic, 'id' | keyof typeof NOTE_POPULATE.topics>,
  RawTopic
>;

/** A note's text is rich text the SDK reads. */
export type SdkContentContract = Fits<NonNullable<Note['content']>, RawRichText>;
