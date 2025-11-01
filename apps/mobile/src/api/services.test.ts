jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoGoConfig: undefined,
    expoConfig: undefined,
  },
}));

const services = require('./services') as typeof import('./services');
const { normalizeHostForPlatform } = services;

describe('normalizeHostForPlatform', () => {
  it('maps android localhost variants to emulator loopback address', () => {
    expect(normalizeHostForPlatform('localhost', 'android')).toBe('10.0.2.2');
    expect(normalizeHostForPlatform('127.0.0.1', 'android')).toBe('10.0.2.2');
    expect(normalizeHostForPlatform('::1', 'android')).toBe('10.0.2.2');
    expect(normalizeHostForPlatform('[::1]', 'android')).toBe('10.0.2.2');
    expect(normalizeHostForPlatform(' 0.0.0.0 ', 'android')).toBe('10.0.2.2');
  });

  it('returns the provided host on non-android platforms', () => {
    expect(normalizeHostForPlatform('localhost', 'ios')).toBe('localhost');
    expect(normalizeHostForPlatform('example.com', 'web')).toBe('example.com');
  });

  it('keeps remote hosts unchanged on android', () => {
    expect(normalizeHostForPlatform('192.168.1.50', 'android')).toBe('192.168.1.50');
  });
});
