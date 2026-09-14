import { describe, it, expect, beforeEach } from "vitest";
import {
  uint8ArrayToBase64,
  base64ToUint8Array,
  getDefaultApiUrl,
  getDefaultAuthToken
} from "../src/crdt/sync.js";
import { crdtStore } from "../src/crdt/doc.js";

describe("CRDT Sync & Serialization Utilities", () => {
  it("converts Uint8Array to base64 and back losslessly", () => {
    const original = new Uint8Array([0, 1, 2, 42, 128, 255]);
    const base64 = uint8ArrayToBase64(original);
    expect(typeof base64).toBe("string");

    const decoded = base64ToUint8Array(base64);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("handles empty and large byte buffers in base64 encoding", () => {
    const empty = new Uint8Array(0);
    expect(uint8ArrayToBase64(empty)).toBe("");
    expect(base64ToUint8Array("")).toEqual(new Uint8Array(0));

    const large = new Uint8Array(20000);
    for (let i = 0; i < large.length; i++) {
      large[i] = i % 256;
    }
    const largeB64 = uint8ArrayToBase64(large);
    const largeDecoded = base64ToUint8Array(largeB64);
    expect(largeDecoded.length).toBe(20000);
    expect(largeDecoded[1000]).toBe(1000 % 256);
  });

  it("provides sensible dev defaults for API URL and Auth Token", () => {
    const url = getDefaultApiUrl();
    expect(typeof url).toBe("string");

    const token = getDefaultAuthToken();
    expect(typeof token).toBe("string");
  });

  it("seeds sample tasks directly into crdtStore", () => {
    crdtStore.switchProject("test-seed-proj", "Test Seed", "SEED");
    const seeded = crdtStore.seedSampleTasks();
    expect(seeded.length).toBe(5);

    const tasks = crdtStore.getTasks();
    expect(tasks.length).toBe(5);
    expect(tasks.some((t) => t.title.includes("CRDT sync layer"))).toBe(true);
    expect(tasks.some((t) => t.title.includes("Cognito"))).toBe(true);
  });
});
