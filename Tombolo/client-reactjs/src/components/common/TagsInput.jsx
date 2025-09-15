import { useMemo, useState } from 'react';
import { Select } from 'antd';

/**
 * TagsInput is a light wrapper around Ant Design's Select that defaults to `mode="tags"`,
 * forwards all standard antd Select props, and can optionally bind to an antd Form via
 * `{ form, name }` when `value`/`onChange` are not provided.
 *
 * It supports three usage patterns:
 * 1) Controlled: caller passes `value` (array) and `onChange` handler.
 * 2) Form-bound: when `form` and `name` are provided and component is not controlled,
 *    it reads and writes to the associated Form.Item field.
 * 3) Uncontrolled (local state): when neither controlled nor form-bound, it manages internal state.
 *
 * Notes:
 * - In tags/multiple modes, the value is normalized to an array. Single values are coerced to `[String(value)]`.
 * - `onChange` always receives an array of selected/tagged values.
 * - All additional props are forwarded to antd's Select.
 *
 * @param {import('antd').FormInstance} [form] Optional Ant Design Form instance for form-bound usage.
 * @param {string} [name] Field name in the form when using form-bound mode.
 * @param {'multiple'|'tags'|undefined} [mode='tags'] Select mode; defaults to 'tags'.
 * @param {Array<string|number>} [value] Controlled value (array) for the select in tags/multiple mode.
 * @param {(next: Array<string|number>) => void} [onChange] Controlled change handler; receives normalized array.
 * @param {string} [placeholder] Placeholder text.
 * @param {boolean} [allowClear] Whether to show clear icon.
 * @param {boolean} [disabled] Disable the input.
 * @param {'small'|'middle'|'large'} [size] AntD size.
 * @param {'error'|'warning'} [status] AntD status.
 * @param {{label: React.ReactNode, value: string|number}[]} [options] Options for Select; forwarded to antd.
 * @param {string} [className] Class name for the Select component.
 * @param {React.CSSProperties} [style] Inline styles for the Select component.
 * @param {...any} rest Any other AntD Select props; forwarded via spread.
 * @returns {JSX.Element} AntD Select configured for multi/tags input with optional form binding.
 */
const TagsInput = ({
  // Optional AntD Form binding
  form,
  name,
  // Typical antd Select props (all forwarded via ...rest)
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
  // Any other antd Select props
  ...rest
}) => {
  // Decide the source of truth: controlled, form-bound, or local state
  const isControlled = value !== undefined;
  const isFormBound = !isControlled && form && name;

  const formValue = isFormBound ? form.getFieldValue(name) : undefined;
  const normalizedValue = useMemo(() => {
    const v = isControlled ? value : isFormBound ? formValue : undefined;
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    // Coerce a single value to array for Select in tags/multiple mode
    return [String(v)];
  }, [isControlled, isFormBound, value, formValue]);

  const [localValue, setLocalValue] = useState([]);
  const currentValue = isControlled || isFormBound ? normalizedValue : localValue;

  const handleChange = (next) => {
    // next should already be an array in tags/multiple mode
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
      {...rest}
    />
  );
};

export default TagsInput;
