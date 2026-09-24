import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import type { TextField } from '@payloadcms/plugin-form-builder/types';
import { Label } from '@/components/ui/label';
import { Textarea as TextAreaComponent } from '@/components/ui/textarea';
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
      <Label htmlFor={name}>{label}</Label>

      <TextAreaComponent
        defaultValue={defaultValue}
        id={name}
        rows={rows}
        {...register(name, { required: requiredFromProps })}
      />

      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
