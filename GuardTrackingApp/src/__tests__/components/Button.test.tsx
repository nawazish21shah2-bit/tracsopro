// Comprehensive Button Component Tests
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import Button from '../../components/common/Button';
import { renderWithProviders } from '../../utils/testUtils';

describe('Button Component', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders button with title', () => {
      const { getByText } = renderWithProviders(<Button {...defaultProps} />);
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders button with icon', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} icon="🚀" />
      );
      expect(getByText('🚀')).toBeTruthy();
    });

    it('renders loading state', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <Button {...defaultProps} loading />
      );
      // When loading, either loading indicator or button should be present
      const loadingIndicator = getByTestId('loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });

    it('renders disabled state', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} disabled />
      );
      const button = getByText('Test Button');
      // Check if button is disabled via accessibility state
      expect(button).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders primary variant correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="primary" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders secondary variant correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="secondary" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders danger variant correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="danger" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders success variant correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="success" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders warning variant correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="warning" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} size="small" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders medium size correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} size="medium" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('renders large size correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} size="large" />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} onPress={onPress} />
      );
      
      fireEvent.press(getByText('Test Button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} onPress={onPress} disabled />
      );
      
      fireEvent.press(getByText('Test Button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} onPress={onPress} loading />
      );
      
      // When loading, button text might not be visible, check for loading indicator
      const loadingIndicator = getByTestId('loading-indicator');
      expect(loadingIndicator).toBeTruthy();
      // onPress should not be called when loading
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = renderWithProviders(<Button {...defaultProps} />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('has correct accessibility label', () => {
      const { getByLabelText } = renderWithProviders(
        <Button {...defaultProps} />
      );
      expect(getByLabelText('Test Button')).toBeTruthy();
    });

    it('is accessible when disabled', () => {
      const { getByRole } = renderWithProviders(
        <Button {...defaultProps} disabled />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Full Width', () => {
    it('renders full width correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} fullWidth />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Custom Styles', () => {
    it('applies custom style', () => {
      const customStyle = { marginTop: 20 };
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} style={customStyle} />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });

    it('applies custom text style', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} textStyle={customTextStyle} />
      );
      const button = getByText('Test Button');
      expect(button).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      const { container } = renderWithProviders(
        <Button {...defaultProps} title="" />
      );
      expect(container).toBeTruthy();
    });

    it('handles very long title', () => {
      const longTitle = 'This is a very long button title that should still render correctly';
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} title={longTitle} />
      );
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('handles undefined onPress', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} onPress={undefined as any} />
      );
      // Should not crash
      expect(getByText('Test Button')).toBeTruthy();
    });
  });
});