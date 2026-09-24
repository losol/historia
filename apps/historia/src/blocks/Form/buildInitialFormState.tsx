import type { FieldValues } from 'react-hook-form';
import type { FormFieldBlock } from '@payloadcms/plugin-form-builder/types';

export const buildInitialFormState = (fields: FormFieldBlock[]) => {
  const initialState: FieldValues = {};

  for (const field of fields ?? []) {
    // Narrow down fields to those that have the 'name' property
    if (!('name' in field)) continue;

    if (field.blockType === 'checkbox') {
      initialState[field.name] = field.defaultValue;
    } else if (['country', 'email', 'text', 'select', 'state'].includes(field.blockType)) {
      initialState[field.name] = '';
    }
  }

  return initialState;
};
