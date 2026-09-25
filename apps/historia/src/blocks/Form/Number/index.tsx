import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { Label } from '@eventuras/ratio-ui/forms';
import type { TextField } from '@payloadcms/plugin-form-builder/types';
import { Input } from '@/components/ui/input';
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
      {/* Same style as the label ratio-ui's Select renders, so all fields match. */}
      <Label className="mb-2 block text-sm font-medium" htmlFor={name}>
        {label}
      </Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        type="number"
        {...register(name, { required: requiredFromProps })}
      />
      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
