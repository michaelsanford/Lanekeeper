import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  isFeatureEnabled,
  setFeatureFlag,
  toggleFeatureFlag,
  resetAllFeatureFlags,
  getAllFeatureFlags,
  getAllFeatureDefinitions,
  getUrlFlagOverride,
  FEATURE_DEFINITIONS
} from '../src/features/engine.js';
import {
  FeatureGateProvider,
  useFeatureGate,
  FeatureGate
} from '../src/features/FeatureGateContext.js';

describe('Feature Gate Engine', () => {
  beforeEach(() => {
    resetAllFeatureFlags();
  });

  it('registers timeTracking flag with defaultValue of false (default to off)', () => {
    expect(FEATURE_DEFINITIONS.timeTracking).toBeDefined();
    expect(FEATURE_DEFINITIONS.timeTracking.defaultValue).toBe(false);
    expect(isFeatureEnabled('timeTracking')).toBe(false);
  });

  it('updates and persists feature flag via setFeatureFlag', () => {
    expect(isFeatureEnabled('timeTracking')).toBe(false);

    setFeatureFlag('timeTracking', true);
    expect(isFeatureEnabled('timeTracking')).toBe(true);

    setFeatureFlag('timeTracking', false);
    expect(isFeatureEnabled('timeTracking')).toBe(false);
  });

  it('toggles feature flag state via toggleFeatureFlag', () => {
    expect(isFeatureEnabled('timeTracking')).toBe(false);

    const firstToggle = toggleFeatureFlag('timeTracking');
    expect(firstToggle).toBe(true);
    expect(isFeatureEnabled('timeTracking')).toBe(true);

    const secondToggle = toggleFeatureFlag('timeTracking');
    expect(secondToggle).toBe(false);
    expect(isFeatureEnabled('timeTracking')).toBe(false);
  });

  it('resets all feature flags back to default values', () => {
    setFeatureFlag('timeTracking', true);
    expect(isFeatureEnabled('timeTracking')).toBe(true);

    resetAllFeatureFlags();
    expect(isFeatureEnabled('timeTracking')).toBe(false);
  });

  it('retrieves all feature flag definitions and current states', () => {
    const defs = getAllFeatureDefinitions();
    expect(defs.some((d) => d.id === 'timeTracking')).toBe(true);

    const all = getAllFeatureFlags();
    expect(all.timeTracking).toBe(false);
  });

  it('parses URL query parameter overrides', () => {
    expect(getUrlFlagOverride('timeTracking', '?ff_timeTracking=true')).toBe(true);
    expect(isFeatureEnabled('timeTracking', '?ff_timeTracking=true')).toBe(true);

    expect(getUrlFlagOverride('timeTracking', '?ff_timeTracking=1')).toBe(true);
    expect(isFeatureEnabled('timeTracking', '?ff_timeTracking=1')).toBe(true);

    expect(getUrlFlagOverride('timeTracking', '?ff_timeTracking=0')).toBe(false);
    expect(isFeatureEnabled('timeTracking', '?ff_timeTracking=0')).toBe(false);

    expect(getUrlFlagOverride('timeTracking', '?ff_timeTracking=false')).toBe(false);
    expect(isFeatureEnabled('timeTracking', '?ff_timeTracking=false')).toBe(false);

    expect(getUrlFlagOverride('timeTracking', '')).toBe(null);
  });
});

describe('FeatureGate React Context & Declarative Component', () => {
  it('renders children only when flag is enabled in FeatureGateProvider', () => {
    const TestComponent = () => (
      React.createElement(FeatureGateProvider, { initialFlags: { timeTracking: true } },
        React.createElement(FeatureGate, {
          flag: 'timeTracking',
          fallback: React.createElement('span', null, 'Fallback Off')
        }, React.createElement('span', null, 'Timer Enabled'))
      )
    );

    const html = renderToString(React.createElement(TestComponent));
    expect(html).toContain('Timer Enabled');
    expect(html).not.toContain('Fallback Off');
  });

  it('renders fallback when flag is disabled in FeatureGateProvider', () => {
    const TestComponent = () => (
      React.createElement(FeatureGateProvider, { initialFlags: { timeTracking: false } },
        React.createElement(FeatureGate, {
          flag: 'timeTracking',
          fallback: React.createElement('span', null, 'Fallback Off')
        }, React.createElement('span', null, 'Timer Enabled'))
      )
    );

    const html = renderToString(React.createElement(TestComponent));
    expect(html).not.toContain('Timer Enabled');
    expect(html).toContain('Fallback Off');
  });

  it('provides isEnabled, definitions, and actions via useFeatureGate hook', () => {
    let capturedHook: any;

    const HookConsumer = () => {
      capturedHook = useFeatureGate();
      return React.createElement('div', null, capturedHook.isEnabled('timeTracking') ? 'ON' : 'OFF');
    };

    const html = renderToString(
      React.createElement(FeatureGateProvider, { initialFlags: { timeTracking: false } },
        React.createElement(HookConsumer)
      )
    );

    expect(html).toContain('OFF');
    expect(capturedHook).toBeDefined();
    expect(capturedHook.definitions.length).toBeGreaterThan(0);
    expect(typeof capturedHook.toggleFlag).toBe('function');
    expect(typeof capturedHook.setFlag).toBe('function');
    expect(typeof capturedHook.resetFlags).toBe('function');
  });
});
