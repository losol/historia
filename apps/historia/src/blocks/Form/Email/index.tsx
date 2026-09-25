import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { TextField as TextFieldComponent } from '@eventuras/ratio-ui/forms';
import type { EmailField } from '@payloadcms/plugin-form-builder/types';
import { FieldError } from '../Error';
import { Width } from '../Width';

export const Email: React.FC<
  EmailField & {
    errors: FieldErrors;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  return (
    <Width width={width}>
      <TextFieldComponent
        label={label}
        defaultValue={defaultValue}
        type="text"
        {...register(name, {
          pattern: { value: /^\S[^\s@]*@\S+$/, message: 'Please enter a valid email address' },
          required: requiredFromProps,
        })}
        errors={errors}
        noWrapper
      />

      {requiredFromProps && errors[name]?.type === 'required' && <FieldError />}
    </Width>
  );
};
