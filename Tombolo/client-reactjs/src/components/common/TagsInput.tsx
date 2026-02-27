import React, { useMemo, useState } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';

type TagsInputProps = {
  form?: any;
  name?: string;
  mode?: SelectProps<any>['mode'];
  value?: any;
  onChange?: (next: any[]) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  size?: SelectProps<any>['size'];
  status?: SelectProps<any>['status'];
  options?: SelectProps<any>['options'];
  className?: string;
  style?: React.CSSProperties;
} & Partial<SelectProps<any>>;

const TagsInput: React.FC<TagsInputProps> = ({
  form,
  name,
  mode = 'tags',
  value,
  onChange,
  placeholder,
  allowClear,
  disabled,
  size,
  status,
  options,
  className,
  style,
  ...rest
}) => {
  const isControlled = value !== undefined;
  const isFormBound = !isControlled && form && name;

  const formValue = isFormBound ? form.getFieldValue(name) : undefined;
  const normalizedValue = useMemo(() => {
    const v = isControlled ? value : isFormBound ? formValue : undefined;
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    return [String(v)];
  }, [isControlled, isFormBound, value, formValue]);

  const [localValue, setLocalValue] = useState<any[]>([]);
  const currentValue = isControlled || isFormBound ? normalizedValue : localValue;

  const handleChange = (next: any) => {
    const arr = Array.isArray(next) ? next : next == null ? [] : [next];
    if (isControlled) {
      onChange?.(arr);
    } else if (isFormBound) {
      form.setFieldsValue({ [name]: arr });
    } else {
      setLocalValue(arr);
      onChange?.(arr);
    }
  };

  return (
    <Select
      mode={mode}
      value={currentValue}
      onChange={handleChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      size={size}
      status={status}
      options={options}
      className={className}
      style={style}
      open={false}
      suffixIcon={null}
      {...(rest as any)}
    />
  );
};

export default TagsInput;
