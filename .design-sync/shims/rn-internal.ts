// Native-renderer internals that reanimated, gesture-handler and screens import
// but never call on the web.
const noop = () => {};
export default new Proxy({}, { get: () => noop });
export const setUpXHR = noop;
export const AppContainer = () => null;
export const ReactFabric = {};
export const get = noop;
export const register = noop;
export const customBubblingEventTypes = {};
export const customDirectEventTypes = {};
export const PressabilityDebugView = () => null;
