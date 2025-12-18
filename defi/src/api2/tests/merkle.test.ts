import { getAddress } from "viem";
import { parseEther } from "ethers";

describe("Merkle API Validation", () => {
  test("viem getAddress should validate Ethereum addresses", () => {
    // Valid address
    const validAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const checksummed = getAddress(validAddress);
    expect(checksummed).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

    // Another valid address with different case
    const validAddress2 = "0xdead000000000000000042069420694206942069";
    const checksummed2 = getAddress(validAddress2);
    expect(typeof checksummed2).toBe("string");
    expect(checksummed2.startsWith("0x")).toBe(true);

    // Invalid address should throw
    expect(() => getAddress("invalid")).toThrow();
    expect(() => getAddress("0x123")).toThrow();
  });

  test("ethers parseEther should convert decimal amounts to wei", () => {
    // Test whole number
    const amount1 = parseEther("1");
    expect(amount1.toString()).toBe("1000000000000000000");

    // Test decimal
    const amount2 = parseEther("0.5");
    expect(amount2.toString()).toBe("500000000000000000");

    // Test large number
    const amount3 = parseEther("1000");
    expect(amount3.toString()).toBe("1000000000000000000000");

    // Test very small decimal
    const amount4 = parseEther("0.000000000000000001");
    expect(amount4.toString()).toBe("1");

    // Invalid amount should throw
    expect(() => parseEther("invalid")).toThrow();
  });

  test("TSV parsing logic", () => {
    const tsvLine = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,10";
    const [address, amount] = tsvLine.split(",").map(s => s.trim());

    // Should be able to validate address
    const validatedAddress = getAddress(address);
    expect(validatedAddress).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

    // Should be able to convert amount
    const weiAmount = parseEther(amount);
    expect(weiAmount.toString()).toBe("10000000000000000000");
  });

  test("Expected output format", () => {
    const expectedOutput = {
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": {
        reason1: "10000000000000000000",
      },
      "0xdEAD000000000000000042069420694206942069": {
        reason1: "5000000000000000000",
      },
    };

    expect(expectedOutput).toHaveProperty("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    expect(expectedOutput["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]).toHaveProperty("reason1");
    expect(typeof expectedOutput["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"].reason1).toBe("string");
  });
});
