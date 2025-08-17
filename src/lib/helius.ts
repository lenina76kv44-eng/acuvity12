import { fetchJson } from './http';

const HELIUS_KEY = process.env.HELIUS_API_KEY!;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const HELIUS_TX = (address: string, startSec: number, endSec: number, limit = 1000) =>
  `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${HELIUS_KEY}&startTime=${startSec}&endTime=${endSec}&limit=${limit}`;

export type EnhancedTx = {
  signature: string;
  timestamp: number;
  tokenTransfers?: Array<{
    tokenAddress?: string; // mint
    mint?: string;         // sometimes present
    type?: string;         // "MINT" | "BURN" | "TRANSFER"
    decimals?: number;
    amount?: string | number;
  }>
}

export async function getEnhancedTxs(address: string, startSec: number, endSec: number): Promise<EnhancedTx[]> {
  try {
    return await fetchJson<EnhancedTx[]>(HELIUS_TX(address, startSec, endSec));
  } catch {
    return [];
  }
}

export async function getTokenSupply(mint: string): Promise<number | null> {
  type RpcRes = { result?: { value: { amount: string; decimals: number } } };
  const body = { jsonrpc: '2.0', id: 1, method: 'getTokenSupply', params: [mint] };
  try {
    const data = await fetchJson<RpcRes>(HELIUS_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!data?.result?.value) return null;
    const v = data.result.value;
    const ui = Number(v.amount) / Math.pow(10, v.decimals);
    return Number.isFinite(ui) ? ui : null;
  } catch { return null; }
}