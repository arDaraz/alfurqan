// A browser has no compass, so an undetermined permission lets a component
// draw its own no-location state instead of throwing.
export enum PermissionStatus {
  GRANTED = 'granted',
  UNDETERMINED = 'undetermined',
  DENIED = 'denied',
}

const undetermined = {
  status: PermissionStatus.UNDETERMINED,
  granted: false,
  canAskAgain: true,
  expires: 'never' as const,
};

export const getForegroundPermissionsAsync = async () => undetermined;
export const requestForegroundPermissionsAsync = async () => undetermined;
export const watchHeadingAsync = async () => ({ remove: () => undefined });
export const getCurrentPositionAsync = async () => {
  throw new Error('location is not available in the design-system bundle');
};
export const reverseGeocodeAsync = async () => [];
export type LocationSubscription = { remove: () => void };
