import type React from 'react';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Select as SelectComponent } from '@eventuras/ratio-ui/forms';
import type { CountryField } from '@payloadcms/plugin-form-builder/types';
import { FieldError } from '../Error';
import { Width } from '../Width';
import { countryOptions } from './options';

export const Country: React.FC<
  CountryField & {
    control: Control<FieldValues>;
    errors: FieldErrors;
  }
> = ({ name, control, errors, label, required, width }) => {
  return (
    <Width width={width}>
      <Controller
        control={control}
        defaultValue=""
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <SelectComponent
            className="w-full"
            label={label}
            placeholder={label}
            name={name}
            options={countryOptions.map((option) => ({ label: option.label, value: option.value }))}
            selectedKey={value || null}
            onSelectionChange={(selected) => onChange(selected ?? '')}
            onBlur={onBlur}
            isRequired={Boolean(required)}
            isInvalid={Boolean(required && errors[name])}
          />
        )}
        rules={{ required }}
      />
      {required && errors[name] && <FieldError />}
    </Width>
  );
};
