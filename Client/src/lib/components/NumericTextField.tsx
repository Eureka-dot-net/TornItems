import { useState, useEffect, useCallback } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

/**
 * NumericTextField Component
 * 
 * A TextField wrapper that handles numeric input with validation on blur instead of onChange.
 * This allows users to fully delete the text and enter new values without the input
 * immediately resetting to a default or minimum value.
 * 
 * Key features:
 * - Allows empty string during editing
 * - Validates and applies min/max constraints on blur
 * - Converts empty value to defaultValue (or 0) on blur
 * - Reduces lag by not triggering parent state updates on every keystroke
 * 
 * @example
 * <NumericTextField
 *   label="Happy"
 *   value={happy}
 *   onChange={(value) => setHappy(value)}
 *   min={0}
 *   max={99999}
 *   defaultValue={0}
 * />
 */

export interface NumericTextFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'onBlur' | 'type'> {
  /** The numeric value. Note: The component accepts number only, not empty string. */
  value: number;
  /** Callback when value changes (called on blur with validated value) */
  onChange: (value: number) => void;
  /** Minimum allowed value (default: 0) */
  min?: number;
  /** Maximum allowed value (optional) */
  max?: number;
  /** Default value when input is empty (default: 0) */
  defaultValue?: number;
  /** Step for input (default: 'any') */
  step?: number | 'any';
}

export default function NumericTextField({
  value,
  onChange,
  min = 0,
  max,
  defaultValue = 0,
  step = 'any',
  inputProps,
  ...textFieldProps
}: NumericTextFieldProps) {
  // Local state to hold the display value (can be empty string during editing)
  const [displayValue, setDisplayValue] = useState<string>(String(value));

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  // Handle input change - just update local state, no validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  }, []);

  // Handle blur - validate and call onChange with the final value
  const handleBlur = useCallback(() => {
    let finalValue: number;

    if (displayValue === '' || displayValue === '-') {
      // Empty input defaults to defaultValue
      finalValue = defaultValue;
    } else {
      const parsed = parseFloat(displayValue);
      if (isNaN(parsed)) {
        finalValue = defaultValue;
      } else {
        // Apply min/max constraints
        finalValue = Math.max(min, parsed);
        if (max !== undefined) {
          finalValue = Math.min(max, finalValue);
        }
      }
    }

    // Update display to show the validated value
    setDisplayValue(String(finalValue));
    
    // Only call onChange if value actually changed (compare as numbers)
    if (finalValue !== value) {
      onChange(finalValue);
    }
  }, [displayValue, defaultValue, min, max, value, onChange]);

  return (
    <TextField
      {...textFieldProps}
      type="number"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      inputProps={{
        step,
        min,
        max,
        ...inputProps,
      }}
    />
  );
}
