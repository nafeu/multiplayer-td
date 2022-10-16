// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const clone = (b) => JSON.parse(JSON.stringify(b));

export const isDebugMode = !(window.location.href.indexOf('preview=true') != -1);
