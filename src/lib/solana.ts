// src/lib/solana.ts
type JsonRpcReq = { jsonrpc: '2.0'; id: number|string; method: string; params?: any[] };

const HELIUS_KEY = process.env.HELIUS_API_KEY!;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

export async function rpc<T=any>(method: string, params: any[], signal?: AbortSignal): Promise<T> {
  const body: JsonRpcReq = { jsonrpc: '2.0', id: Date.now(), method, params };
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) throw new Error(`${method}: ${res.status}`);
  const out = await res.json();
  if (out.error) throw new Error(`${method}: ${out.error.message || 'rpc error'}`);
  return out.result as T;
}

export async function rpcBatchGetParsedTransactions(sigs: string[], signal?: AbortSignal) {
  // One RPC call for up to ~100 signatures
  return rpc<any>('getParsedTransactions', [sigs, { maxSupportedTransactionVersion: 0 }], signal);
}