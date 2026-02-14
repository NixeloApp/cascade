import { describe, expect, it } from "vitest";
import { decryptE2EData, encryptE2EData } from "./e2eCrypto";

describe("e2eCrypto", () => {
  it("should encrypt and decrypt correctly", async () => {
    const data = "123456";
    const apiKey = "my-secret-key";

    const encrypted = await encryptE2EData(data, apiKey);
    expect(encrypted).not.toBe(data);

    const decrypted = await decryptE2EData(encrypted, apiKey);
    expect(decrypted).toBe(data);
  });

  it("should fail to decrypt with wrong key", async () => {
    const data = "123456";
    const apiKey = "my-secret-key";
    const wrongKey = "wrong-key";

    const encrypted = await encryptE2EData(data, apiKey);

    await expect(decryptE2EData(encrypted, wrongKey)).rejects.toThrow();
  });

  it("should generate different ciphertexts for same data (random IV)", async () => {
    const data = "123456";
    const apiKey = "my-secret-key";

    const encrypted1 = await encryptE2EData(data, apiKey);
    const encrypted2 = await encryptE2EData(data, apiKey);

    expect(encrypted1).not.toBe(encrypted2);
  });
});
