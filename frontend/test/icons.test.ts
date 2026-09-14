import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  LanekeeperLogo,
  SwimlaneIcon,
  LaneKeepIcon,
  SwimlaneBuoyIcon,
  LaneLimitAlertIcon,
  TrafficLight
} from '../src/components/icons/LaneIcons.js';

describe('Swimlane & Lane Keeping Iconography', () => {
  it('renders LanekeeperLogo with swimlane dividers and lane-keeping beacon', () => {
    const html = renderToString(React.createElement(LanekeeperLogo, { size: 24 }));
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 24 24"');
    // Lane cables
    expect(html).toContain('x1="5.5"');
    expect(html).toContain('x1="18.5"');
    // Center forward beacon
    expect(html).toContain('M12 4.5');
  });

  it('renders SwimlaneIcon with 3 swimlane tracks', () => {
    const html = renderToString(React.createElement(SwimlaneIcon, { size: 20 }));
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 24 24"');
    // Divider ropes
    expect(html).toContain('x1="8.5"');
    expect(html).toContain('x1="15.5"');
  });

  it('renders LaneKeepIcon with dual boundary guides and centered track navigator', () => {
    const html = renderToString(React.createElement(LaneKeepIcon, { size: 16 }));
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 24 24"');
    // Boundary guide rails
    expect(html).toContain('x1="5"');
    expect(html).toContain('x1="19"');
    // Center aligned navigator
    expect(html).toContain('M12 4.5');
  });

  it('renders SwimlaneBuoyIcon with cylindrical body and wave-breaker ribs', () => {
    const html = renderToString(React.createElement(SwimlaneBuoyIcon, { size: 16 }));
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('rect');
  });

  it('renders LaneLimitAlertIcon with warning boundary indicators', () => {
    const html = renderToString(React.createElement(LaneLimitAlertIcon, { size: 14 }));
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 16 16"');
  });

  it('renders TrafficLight with vertical and horizontal signal states', () => {
    const greenHtml = renderToString(React.createElement(TrafficLight, { state: 'green', size: 20 }));
    expect(greenHtml).toContain('viewBox="0 0 14 30"');
    expect(greenHtml).toContain('#22c55e'); // Active green lamp

    const redHtml = renderToString(React.createElement(TrafficLight, { state: 'red', size: 20 }));
    expect(redHtml).toContain('#ef4444'); // Active red lamp

    const amberHtml = renderToString(React.createElement(TrafficLight, { state: 'amber', size: 20 }));
    expect(amberHtml).toContain('#f59e0b'); // Active amber lamp

    const horizontalHtml = renderToString(React.createElement(TrafficLight, { state: 'green', size: 16, horizontal: true }));
    expect(horizontalHtml).toContain('viewBox="0 0 32 14"');
  });
});
