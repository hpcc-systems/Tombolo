import { useMemo, useState } from 'react';
import styles from './common.module.css';

// Simple, controlled TagsInput to replace antd Select mode="tags" for reliable Enter/Tab behavior
function TagsInput({ form, name, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const values = form?.getFieldValue(name) || [];

  const setValues = (next) => {
    form?.setFieldsValue({ [name]: next });
  };

  const addValue = (raw) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    // avoid duplicates, keep original if wildcard or alphanumeric with ._-
    if (values.includes(trimmed)) return;
    setValues([...values, trimmed]);
  };

  const removeAt = (idx) => {
    const next = values.filter((_, i) => i !== idx);
    setValues(next);
  };

  const parseAndAddMany = (text) => {
    // split by comma and whitespace
    const parts = text
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return false;
    let changed = false;
    parts.forEach((p) => {
      if (!values.includes(p)) {
        values.push(p);
        changed = true;
      }
    });
    if (changed) setValues([...values]);
    return changed;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Backspace' && !inputValue) {
      // remove last tag
      if (values.length > 0) {
        e.preventDefault();
        setValues(values.slice(0, -1));
      }
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      if (inputValue) {
        e.preventDefault();
        // support comma separated paste
        parseAndAddMany(inputValue) || addValue(inputValue);
        setInputValue('');
        // keep focus so the user can continue typing; Tab should still move next on subsequent press
        if (e.key === 'Tab') {
          // simulate that next Tab will move forward naturally with empty input
          // do nothing here; focus remains in input
        }
      } else {
        // empty input: let default behavior happen
        // for Enter: default in input is usually no-op; for Tab: moves focus forward
      }
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    if (text.includes(',')) {
      e.preventDefault();
      parseAndAddMany(text);
    }
  };

  const divClassName = useMemo(() => {
    let classArr = [styles.tagsInputContainer];
    if (isFocused) classArr.push(styles.tagsInputContainerFocused);
    return classArr.join(' ');
  }, [isFocused]);

  return (
    <div className={divClassName}>
      {values.map((v, idx) => (
        <span key={`${v}-${idx}`} className={styles.tagChip}>
          {v}
          <button
            type="button"
            className={styles.tagRemoveButton}
            aria-label={`Remove ${v}`}
            onClick={() => removeAt(idx)}>
            ×
          </button>
        </span>
      ))}
      <input
        aria-label={placeholder}
        placeholder={values.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={styles.tagsInputField}
      />
    </div>
  );
}

export default TagsInput;
