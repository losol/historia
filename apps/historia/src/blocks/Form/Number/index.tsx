import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { TextField as TextFieldComponent } from '@eventuras/ratio-ui/forms';
import type { TextField } from '@payloadcms/plugin-form-builder/types';
import { FieldError } from '../Error';
import { Width } from '../Width';
export const NumberField: React.FC<
  TextField & {
    errors: FieldErrors;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  return (
    <Width width={width}>
      <TextFieldComponent
        label={label}
        defaultValue={defaultValue}
        type="number"
        {...register(name, { required: requiredFromProps })}
        errors={errors}
        noWrapper
      />
      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
