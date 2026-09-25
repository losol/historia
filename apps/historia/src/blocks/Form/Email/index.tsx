import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { Label } from '@eventuras/ratio-ui/forms';
import type { EmailField } from '@payloadcms/plugin-form-builder/types';
import { Input } from '@/components/ui/input';
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
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        type="text"
        {...register(name, { pattern: /^\S[^\s@]*@\S+$/, required: requiredFromProps })}
      />

      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
