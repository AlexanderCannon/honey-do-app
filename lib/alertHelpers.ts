import { Alert } from 'react-native';

/**
 * Helper function to show confirmation dialogs that require user action.
 * Use this for destructive actions that need explicit confirmation.
 * For simple notifications, prefer toast messages instead.
 */
export const showConfirmationAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }
) => {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
  } = options || {};

  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel' },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]
  );
};

/**
 * Helper function for simple OK alerts that just need acknowledgment.
 * Consider using toast messages instead for better UX.
 */
export const showSimpleAlert = (
  title: string,
  message: string,
  onOK?: () => void
) => {
  Alert.alert(title, message, [
    { text: 'OK', onPress: onOK },
  ]);
};
