import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { Checkbox as CheckboxUi } from '@eventuras/ratio-ui/forms';
import type { CheckboxField } from '@payloadcms/plugin-form-builder/types';
import { FieldError } from '../Error';
import { Width } from '../Width';

export const Checkbox: React.FC<
  CheckboxField & {
    errors: FieldErrors;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  return (
    <Width width={width}>
      {/* A native checkbox, so react-hook-form's register() handles its value directly. */}
      <CheckboxUi
        id={name}
        defaultChecked={defaultValue}
        {...register(name, { required: requiredFromProps })}
      >
        <CheckboxUi.Label>{label}</CheckboxUi.Label>
      </CheckboxUi>
      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
