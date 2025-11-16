import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { RefreshCwIcon, WifiOffIcon, AlertCircleIcon } from './FeatherIcons';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  cancellable?: boolean;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  cancellable = false,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{message}</Text>
          {cancellable && onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface InlineLoadingProps {
  size?: 'small' | 'large';
  message?: string;
  style?: any;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'small',
  message,
  style,
}) => {
  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator
        size={size}
        color={COLORS.primary}
        style={styles.inlineSpinner}
      />
      {message && <Text style={styles.inlineText}>{message}</Text>}
    </View>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
  style,
}) => {
  return (
    <View style={[styles.errorContainer, style]}>
      <AlertCircleIcon size={48} color={COLORS.error} style={styles.errorIcon} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <View style={styles.errorActions}>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <RefreshCwIcon size={16} color={COLORS.primary} style={styles.buttonIcon} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  style?: any;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.errorContainer, style]}>
      <WifiOffIcon size={48} color={COLORS.textSecondary} style={styles.errorIcon} />
      <Text style={styles.errorTitle}>No Internet Connection</Text>
      <Text style={styles.errorMessage}>
        Please check your internet connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCwIcon size={16} color={COLORS.primary} style={styles.buttonIcon} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionText,
  onAction,
  icon,
  style,
}) => {
  return (
    <View style={[styles.emptyContainer, style]}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface SkeletonLoaderProps {
  lines?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 3,
  style,
}) => {
  return (
    <View style={[styles.skeletonContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonLine,
            index === lines - 1 && styles.skeletonLineShort,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  inlineSpinner: {
    marginRight: SPACING.sm,
  },
  inlineText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  errorActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dismissButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dismissButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  actionButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  skeletonContainer: {
    padding: SPACING.md,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  skeletonLineShort: {
    width: '60%',
  },
});
