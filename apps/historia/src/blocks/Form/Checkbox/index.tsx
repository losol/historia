import type React from 'react';
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import type { CheckboxField } from '@payloadcms/plugin-form-builder/types';
import { Checkbox as CheckboxUi } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FieldError } from '../Error';
import { Width } from '../Width';

export const Checkbox: React.FC<
  CheckboxField & {
    errors: FieldErrors;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  const props = register(name, { required: requiredFromProps });
  const { setValue } = useFormContext();

  return (
    <Width width={width}>
      <div className="flex items-center gap-2">
        <CheckboxUi
          defaultChecked={defaultValue}
          id={name}
          {...props}
          onCheckedChange={(checked) => {
            setValue(props.name, checked);
          }}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
      {requiredFromProps && errors[name] && <FieldError />}
    </Width>
  );
};
