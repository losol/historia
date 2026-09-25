import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { TextField as TextFieldComponent } from '@eventuras/ratio-ui/forms';
import type { TextField } from '@payloadcms/plugin-form-builder/types';
import { FieldError } from '../Error';
import { Width } from '../Width';

export const Textarea: React.FC<
  TextField & {
    errors: FieldErrors;
    register: UseFormRegister<FieldValues>;
    rows?: number;
  }
> = ({
  name,
  defaultValue,
  errors,
  label,
  register,
  required: requiredFromProps,
  rows = 3,
  width,
}) => {
  return (
    <Width width={width}>
      <TextFieldComponent
        label={label}
        defaultValue={defaultValue}
        rows={rows}
        {...register(name, { required: requiredFromProps })}
        multiline
        errors={requiredFromProps ? errors : undefined}
        noWrapper
      />

      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
