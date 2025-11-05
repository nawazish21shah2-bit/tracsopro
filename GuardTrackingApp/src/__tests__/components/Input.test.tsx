// Comprehensive Input Component Tests
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import Input from '../../components/common/Input';
import { renderWithProviders } from '../../utils/testUtils';

describe('Input Component', () => {
  const defaultProps = {
    placeholder: 'Enter text',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders input with placeholder', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} />
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders input with label', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} label="Test Label" />
      );
      expect(getByText('Test Label')).toBeTruthy();
    });

    it('renders required indicator', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} label="Test Label" required />
      );
      expect(getByText('*')).toBeTruthy();
    });

    it('renders helper text', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} helperText="Helper text" />
      );
      expect(getByText('Helper text')).toBeTruthy();
    });

    it('renders error message', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} error="Error message" />
      );
      expect(getByText('Error message')).toBeTruthy();
    });

    it('renders left icon', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} leftIcon="📧" />
      );
      expect(getByText('📧')).toBeTruthy();
    });

    it('renders right icon', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} rightIcon="👁️" />
      );
      expect(getByText('👁️')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} variant="default" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.parent).toHaveStyle({ backgroundColor: '#F8F9FA' });
    });

    it('renders outlined variant correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} variant="outlined" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.parent).toHaveStyle({ borderWidth: 2 });
    });

    it('renders filled variant correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} variant="filled" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.parent).toHaveStyle({ backgroundColor: '#F5F5F5' });
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} size="small" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input).toHaveStyle({ fontSize: 14 });
    });

    it('renders medium size correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} size="medium" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input).toHaveStyle({ fontSize: 16 });
    });

    it('renders large size correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} size="large" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input).toHaveStyle({ fontSize: 18 });
    });
  });

  describe('Interactions', () => {
    it('calls onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} onChangeText={onChangeText} />
      );
      
      fireEvent.changeText(getByPlaceholderText('Enter text'), 'test input');
      expect(onChangeText).toHaveBeenCalledWith('test input');
    });

    it('calls onRightIconPress when right icon is pressed', () => {
      const onRightIconPress = jest.fn();
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} rightIcon="👁️" onRightIconPress={onRightIconPress} />
      );
      
      fireEvent.press(getByText('👁️'));
      expect(onRightIconPress).toHaveBeenCalledTimes(1);
    });

    it('handles focus and blur events', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} />
      );
      
      const input = getByPlaceholderText('Enter text');
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      
      // Should not crash
      expect(input).toBeTruthy();
    });
  });

  describe('States', () => {
    it('renders disabled state correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} disabled />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });

    it('renders loading state correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} loading />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.editable).toBe(false);
    });

    it('shows error state styling', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} error="Error message" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.parent).toHaveStyle({ borderColor: '#FF4444' });
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility label when label is provided', () => {
      const { getByLabelText } = renderWithProviders(
        <Input {...defaultProps} label="Test Label" />
      );
      expect(getByLabelText('Test Label')).toBeTruthy();
    });

    it('has correct accessibility hint when helper text is provided', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} helperText="Helper text" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessibilityHint).toBe('Helper text');
    });

    it('has correct accessibility state when disabled', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} disabled />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Text Input Props', () => {
    it('passes through keyboardType', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} keyboardType="email-address" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('passes through autoCapitalize', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} autoCapitalize="none" />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('passes through secureTextEntry', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('passes through value', () => {
      const { getByDisplayValue } = renderWithProviders(
        <Input {...defaultProps} value="test value" />
      );
      expect(getByDisplayValue('test value')).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('applies custom container style', () => {
      const customStyle = { marginTop: 20 };
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} containerStyle={customStyle} />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input.parent.parent).toHaveStyle(customStyle);
    });

    it('applies custom input style', () => {
      const customStyle = { fontSize: 20 };
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} inputStyle={customStyle} />
      );
      const input = getByPlaceholderText('Enter text');
      expect(input).toHaveStyle(customStyle);
    });

    it('applies custom label style', () => {
      const customStyle = { color: 'red' };
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} label="Test Label" labelStyle={customStyle} />
      );
      expect(getByText('Test Label')).toHaveStyle(customStyle);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined onChangeText', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} onChangeText={undefined as any} />
      );
      
      fireEvent.changeText(getByPlaceholderText('Enter text'), 'test');
      // Should not crash
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('handles empty error message', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} error="" />
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('handles very long error message', () => {
      const longError = 'This is a very long error message that should still render correctly without breaking the layout';
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} error={longError} />
      );
      expect(getByText(longError)).toBeTruthy();
    });
  });
});

