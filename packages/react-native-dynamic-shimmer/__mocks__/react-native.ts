/**
 * Minimal react-native mock for Vitest / jsdom environment.
 * Only exposes what @testing-library/react-native actually uses.
 */
export const StyleSheet = {
  flatten: (style: unknown) => {
    if (style === null || style === undefined) return undefined;
    if (Array.isArray(style)) {
      return style.reduce<Record<string, unknown>>(
        (acc, s) => Object.assign(acc, StyleSheet.flatten(s)),
        {},
      );
    }
    if (typeof style === "object") return { ...(style as Record<string, unknown>) };
    return undefined;
  },
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 0.5,
  absoluteFill: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
};

export const View = "View";
export const Text = "Text";
export const Image = "Image";
export const Pressable = "Pressable";
export const TouchableOpacity = "TouchableOpacity";
export const TouchableHighlight = "TouchableHighlight";
export const TouchableWithoutFeedback = "TouchableWithoutFeedback";
export const ScrollView = "ScrollView";
export const FlatList = "FlatList";
export const SectionList = "SectionList";
export const Modal = "Modal";
export const ActivityIndicator = "ActivityIndicator";
export const TextInput = "TextInput";
export const Switch = "Switch";
export const SafeAreaView = "SafeAreaView";
export const KeyboardAvoidingView = "KeyboardAvoidingView";

export const Platform = {
  OS: "ios",
  Version: 0,
  select: <T extends Record<string, unknown>>(obj: T): unknown => obj.ios ?? obj.default,
  isPad: false,
  isTVOS: false,
  isTV: false,
};

export const Dimensions = {
  get: (_dim: string) => ({ width: 375, height: 667, scale: 2, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
  set: () => {},
};

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size * 2,
  roundToNearestPixel: (size: number) => Math.round(size * 2) / 2,
};

export const AccessibilityInfo = {
  addEventListener: () => ({ remove: () => {} }),
  announceForAccessibility: () => {},
  isReduceMotionEnabled: async () => false,
  isScreenReaderEnabled: async () => false,
};

export const NativeModules = {};
export const NativeEventEmitter = class {
  addListener() {
    return { remove: () => {} };
  }
};
export const DeviceEventEmitter = { addListener: () => ({ remove: () => {} }) };

export const Animated = {
  Value: class {
    setValue(_v: number) {}
  },
  View: "Animated.View",
  Text: "Animated.Text",
  Image: "Animated.Image",
  timing: () => ({ start: () => {}, stop: () => {} }),
  spring: () => ({ start: () => {}, stop: () => {} }),
  decay: () => ({ start: () => {}, stop: () => {} }),
  sequence: () => ({ start: () => {}, stop: () => {} }),
  parallel: () => ({ start: () => {}, stop: () => {} }),
  createAnimatedComponent: (c: unknown) => c,
};

export const I18nManager = { isRTL: false, forceRTL: () => {}, allowRTL: () => {} };
export const BackHandler = { addEventListener: () => ({ remove: () => {} }), exitApp: () => {} };
export const Alert = { alert: () => {}, prompt: () => {} };
export const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
};

export const useWindowDimensions = () => ({ width: 375, height: 667, scale: 2, fontScale: 1 });
export const useColorScheme = () => "light";

export const findNodeHandle = () => null;
export const UIManager = {};
export const requireNativeComponent = () => "View";

export default {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  SectionList,
  Modal,
  ActivityIndicator,
  TextInput,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PixelRatio,
  AccessibilityInfo,
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  Animated,
  I18nManager,
  BackHandler,
  Alert,
  Keyboard,
  useWindowDimensions,
  useColorScheme,
  findNodeHandle,
  UIManager,
  requireNativeComponent,
};
