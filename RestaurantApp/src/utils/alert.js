import { Alert, Platform } from 'react-native';

// Alert.alert() shows nothing in the web browser, so use the browser's own popups there.
export const notify = (title, message) => {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
};

export const confirmAction = (title, message, confirmText, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};