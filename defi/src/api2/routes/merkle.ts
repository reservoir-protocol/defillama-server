import * as HyperExpress from "hyper-express";
import { getAddress } from "viem";
import { parseEther } from "ethers";
import { successResponse, errorResponse, errorWrapper as ew } from "./utils";

interface TSVRow {
  address: string;
  amount: string;
}

interface MerkleResult {
  [address: string]: {
    reason1: string;
  };
}

/**
 * Fetches TSV data from a URL, parses it, validates addresses, and converts amounts to wei.
 * Expected TSV format: address, amount (comma-separated)
 */
async function processTSVData(url: string): Promise<MerkleResult> {
  // Fetch the TSV data from the provided URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch TSV data: ${response.statusText}`);
  }

  const tsvText = await response.text();
  const lines = tsvText.trim().split('\n');

  const result: MerkleResult = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse the TSV line (comma or tab separated)
    const parts = line.split(/[,\t]+/).map(part => part.trim());

    if (parts.length < 2) {
      throw new Error(`Invalid TSV format at line ${i + 1}: expected "address, amount"`);
    }

    const [rawAddress, rawAmount] = parts;

    // Validate and normalize the address using viem's getAddress
    let validatedAddress: string;
    try {
      validatedAddress = getAddress(rawAddress);
    } catch (error) {
      throw new Error(`Invalid address at line ${i + 1}: ${rawAddress}`);
    }

    // Convert amount from decimal to BigNumber (wei) using ethers parseEther
    let weiAmount: string;
    try {
      const bigNumberAmount = parseEther(rawAmount);
      weiAmount = bigNumberAmount.toString();
    } catch (error) {
      throw new Error(`Invalid amount at line ${i + 1}: ${rawAmount}`);
    }

    // Store the result
    result[validatedAddress] = {
      reason1: weiAmount
    };
  }

  return result;
}

/**
 * POST /api/merkle handler
 * Expects a JSON body with a "url" field containing the link to the TSV data
 */
async function merkleHandler(req: HyperExpress.Request, res: HyperExpress.Response) {
  try {
    // Parse the request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || !body.url) {
      return errorResponse(res, 'Missing required parameter: url', { statusCode: 400 });
    }

    const { url } = body;

    // Validate that url is a string
    if (typeof url !== 'string') {
      return errorResponse(res, 'Invalid parameter: url must be a string', { statusCode: 400 });
    }

    // Process the TSV data
    const result = await processTSVData(url);

    // Return the result
    return successResponse(res, result, 0);
  } catch (error: any) {
    console.error('Error in merkleHandler:', error);
    return errorResponse(res, error.message || 'Internal server error', { statusCode: 500 });
  }
}

export default merkleHandler;
