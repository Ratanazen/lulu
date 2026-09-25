import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CapabilityService, RuntimeCapability } from '../src/services/capabilityService';

describe('Machine-Readable Capability Matrix & Source-of-Truth', () => {
  const capabilitiesJsonPath = path.resolve('docs/capabilities.json');

  it('loads and validates docs/capabilities.json schema', () => {
    expect(fs.existsSync(capabilitiesJsonPath)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(capabilitiesJsonPath, 'utf8'));

    expect(raw.schema_version).toBe(1);
    expect(raw.application).toBe('Lulu');
    expect(Array.isArray(raw.capabilities)).toBe(true);
    expect(raw.capabilities.length).toBeGreaterThanOrEqual(10);

    const allowedStatuses = new Set([
      'supported',
      'partial',
      'unsupported',
      'experimental',
      'disabled',
      'requires_permission',
      'requires_dependency',
    ]);

    const allowedPrivacy = new Set([
      'local_only',
      'user_controlled',
      'requires_permission',
      'network_required',
    ]);

    const ids = new Set<string>();

    for (const cap of raw.capabilities) {
      expect(typeof cap.id).toBe('string');
      expect(ids.has(cap.id)).toBe(false);
      ids.add(cap.id);

      expect(typeof cap.name).toBe('string');
      expect(typeof cap.category).toBe('string');
      expect(typeof cap.platforms).toBe('object');
      expect(Array.isArray(cap.requires)).toBe(true);
      expect(typeof cap.optional).toBe('boolean');
      expect(allowedStatuses.has(cap.status)).toBe(true);
      expect(typeof cap.fallback).toBe('string');
      expect(allowedPrivacy.has(cap.privacy)).toBe(true);
    }
  });

  it('correctly computes effective state separating capability availability from user settings', () => {
    const supportedCap: RuntimeCapability = {
      id: 'music.mpris',
      name: 'MPRIS Music Detection',
      category: 'music',
      status: 'supported',
      platform: 'linux',
      windowSystem: 'wayland',
      dependencies: { dbus: true, mpris: true },
      permission: 'not_required',
      fallback: 'music_metadata_unavailable',
      privacy: 'local_only',
    };

    // Supported + User wants ON -> enabled
    const effOn = CapabilityService.computeEffectiveState(supportedCap, true);
    expect(effOn.effectiveState).toBe('enabled');
    expect(effOn.availability).toBe('supported');

    // Supported + User wants OFF -> disabled
    const effOff = CapabilityService.computeEffectiveState(supportedCap, false);
    expect(effOff.effectiveState).toBe('disabled');
    expect(effOff.availability).toBe('supported');

    // Unsupported + User wants ON -> unavailable (User cannot override native inability!)
    const unsupportedCap: RuntimeCapability = {
      ...supportedCap,
      status: 'unsupported',
      dependencies: { dbus: false, mpris: false },
      reason: 'D-Bus unavailable',
    };
    const effUnavail = CapabilityService.computeEffectiveState(unsupportedCap, true);
    expect(effUnavail.effectiveState).toBe('unavailable');
    expect(effUnavail.availability).toBe('unsupported');

    // Requires dependency (e.g. Ollama daemon not running)
    const depCap: RuntimeCapability = {
      ...supportedCap,
      id: 'ai.ollama',
      status: 'requires_dependency',
      dependencies: { ollama: false },
    };
    const effDep = CapabilityService.computeEffectiveState(depCap, true);
    expect(effDep.effectiveState).toBe('requires_dependency');
  });

  it('enforces feature gating through isFeatureUsable', () => {
    const supportedCap: RuntimeCapability = {
      id: 'pet.multi_monitor',
      name: 'Multi Monitor',
      category: 'display',
      status: 'supported',
      platform: 'linux',
      windowSystem: 'wayland',
      dependencies: {},
      permission: 'not_required',
      privacy: 'local_only',
    };

    const unsupportedCap: RuntimeCapability = {
      ...supportedCap,
      id: 'notifications.dbus',
      status: 'unsupported',
    };

    const partialCap: RuntimeCapability = {
      ...supportedCap,
      id: 'pet.always_on_top',
      status: 'partial',
    };

    expect(CapabilityService.isFeatureUsable(supportedCap, true)).toBe(true);
    expect(CapabilityService.isFeatureUsable(supportedCap, false)).toBe(false);

    expect(CapabilityService.isFeatureUsable(partialCap, true)).toBe(true);
    expect(CapabilityService.isFeatureUsable(partialCap, false)).toBe(false);

    // Unsupported is never usable, even if userEnabled is passed as true
    expect(CapabilityService.isFeatureUsable(unsupportedCap, true)).toBe(false);
    expect(CapabilityService.isFeatureUsable(null, true)).toBe(false);
  });

  it('guarantees privacy compliance and defaults for sensitive capabilities', () => {
    const raw = JSON.parse(fs.readFileSync(capabilitiesJsonPath, 'utf8'));

    const sensitiveIds = [
      'context.screen',
      'context.clipboard',
      'tools.shell',
      'notifications.message_content',
    ];

    for (const sid of sensitiveIds) {
      const cap = raw.capabilities.find((c: any) => c.id === sid);
      expect(cap).toBeDefined();
      expect(
        cap.privacy === 'requires_permission' || cap.privacy === 'user_controlled'
      ).toBe(true);
      expect(
        cap.status === 'requires_permission' || cap.status === 'disabled'
      ).toBe(true);
    }
  });

  it('ensures clean diagnostics report contains zero private content or credentials', async () => {
    const report = await CapabilityService.getDiagnosticsReport();
    expect(report).toBeDefined();

    const reportJson = JSON.stringify(report);
    expect(reportJson).not.toContain('apiKey');
    expect(reportJson).not.toContain('password');
    expect(reportJson).not.toContain('token');
    expect(reportJson).not.toContain('chatMessages');
    expect(reportJson).not.toContain('secret');
  });
});
