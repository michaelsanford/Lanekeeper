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

describe('Configurable Lane Marker Palette', () => {
  it('renders default buoy float marker when icon is unspecified or buoy', async () => {
    const { LaneMarker } = await import('../src/components/icons/LaneMarker.js');
    const htmlDefault = renderToString(React.createElement(LaneMarker, { color: '#3b82f6', size: 16 }));
    expect(htmlDefault).toContain('<svg');
    expect(htmlDefault).toContain('color:#3b82f6');
    expect(htmlDefault).toContain('Swimlane Buoy');

    const htmlBuoy = renderToString(React.createElement(LaneMarker, { icon: 'buoy', color: '#10b981', size: 18 }));
    expect(htmlBuoy).toContain('<svg');
    expect(htmlBuoy).toContain('color:#10b981');
  });

  it('renders preset icons with customized colors and titles', async () => {
    const { LaneMarker } = await import('../src/components/icons/LaneMarker.js');
    const htmlCheck = renderToString(React.createElement(LaneMarker, { icon: 'check-circle', color: '#10b981', size: 18 }));
    expect(htmlCheck).toContain('<svg');
    expect(htmlCheck).toContain('color:#10b981');
    expect(htmlCheck).toContain('Check Circle (Done)');

    const htmlEye = renderToString(React.createElement(LaneMarker, { icon: 'eye', color: '#06b6d4', size: 16 }));
    expect(htmlEye).toContain('<svg');
    expect(htmlEye).toContain('color:#06b6d4');
    expect(htmlEye).toContain('Eye (Review)');

    const htmlZap = renderToString(React.createElement(LaneMarker, { icon: 'zap', color: '#f59e0b', size: 16 }));
    expect(htmlZap).toContain('<svg');
    expect(htmlZap).toContain('color:#f59e0b');
    expect(htmlZap).toContain('Lightning (Active)');
  });

  it('renders custom glyphs or symbols with color styling', async () => {
    const { LaneMarker } = await import('../src/components/icons/LaneMarker.js');
    const htmlCustom = renderToString(React.createElement(LaneMarker, { icon: '*', color: '#ec4899', size: 20 }));
    expect(htmlCustom).toContain('*');
    expect(htmlCustom).toContain('color:#ec4899');
    expect(htmlCustom).toContain('font-size:20px');
  });

  it('renders LaneMarkerPickerModal with categories and markers', async () => {
    const { LaneMarkerPickerModal } = await import('../src/components/project/LaneMarkerPickerModal.js');
    const html = renderToString(
      React.createElement(LaneMarkerPickerModal, {
        isOpen: true,
        onClose: () => {},
        currentIcon: 'eye',
        laneColor: '#06b6d4',
        laneName: 'Review',
        onSelectIcon: () => {}
      })
    );

    expect(html).toContain('Choose Swimlane Marker');
    expect(html).toContain('Review');
    expect(html).toContain('Search markers');
    expect(html).toContain('Flow &amp; Status');
    expect(html).toContain('Review &amp; QA');
    expect(html).toContain('Planning &amp; Backlog');
    expect(html).toContain('Dev &amp; Engineering');
    expect(html).toContain('Goals &amp; Milestones');
    expect(html).toContain('Default Buoy');
  });
});
