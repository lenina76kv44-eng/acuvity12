export type EnhancedTx = any;

const eq = (a?: string, b?: string) => (a || "").toLowerCase() === (b || "").toLowerCase();

/** Собираем mint'ы токенов, которые кошелёк ПОЛУЧИЛ (выход свопа) */
export function getBoughtTokenMints(tx: EnhancedTx, wallet: string): Set<string> {
  const out = new Set<string>();
  
  // Исключаем основные токены
  const EXCLUDED_TOKENS = new Set([
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
  ]);

  try {
    // 1) Анализируем события свопов
    const events = tx?.events;
    if (events && typeof events === 'object') {
      // Проверяем разные типы событий
      const swapEvent = events.swap || events.SWAP;
      if (swapEvent) {
        // Ищем токены, которые получил кошелек
        const outputs = swapEvent.tokenOutputs || swapEvent.tokenTransfers || swapEvent.tokens || [];
        if (Array.isArray(outputs)) {
          for (const output of outputs) {
            const to = output?.toUserAccount || output?.userAccount || output?.destination;
            const mint = output?.mint || output?.mintAddress;
            if (to && mint && eq(to, wallet) && !EXCLUDED_TOKENS.has(mint)) {
              out.add(mint);
            }
          }
        }
      }
    }

    // 2) Фоллбек: анализируем tokenTransfers
    const tokenTransfers = tx?.tokenTransfers;
    if (Array.isArray(tokenTransfers)) {
      for (const transfer of tokenTransfers) {
        const to = transfer?.toUserAccount || transfer?.destination;
        const toOwner = transfer?.toUserAccountOwner;
        const mint = transfer?.mint || transfer?.mintAddress;
        
        // Проверяем, что токен пришел на наш кошелек
        if (mint && !EXCLUDED_TOKENS.has(mint)) {
          if ((to && eq(to, wallet)) || (toOwner && eq(toOwner, wallet))) {
            out.add(mint);
          }
        }
      }
    }

    // 3) Дополнительная проверка для SWAP транзакций
    if (tx?.type === 'SWAP') {
      // Для SWAP транзакций ищем все входящие токены
      const allTransfers = tx?.tokenTransfers || [];
      for (const transfer of allTransfers) {
        const to = transfer?.toUserAccount || transfer?.toUserAccountOwner;
        const mint = transfer?.mint;
        
        if (mint && !EXCLUDED_TOKENS.has(mint) && to && eq(to, wallet)) {
          // Проверяем, что это не исходящий перевод
          const from = transfer?.fromUserAccount || transfer?.fromUserAccountOwner;
          if (!from || !eq(from, wallet)) {
            out.add(mint);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error parsing transaction:', error);
  }

  return out;
}

export function intersectMany(sets: Set<string>[]): string[] {
  if (sets.length === 0) return [];
  if (sets.length === 1) return [...sets[0]];
  
  let result = sets[0];
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter(x => sets[i].has(x)));
    if (result.size === 0) break;
  }
  
  return [...result];
}

// Функция для получения метаданных токенов
export async function fetchTokenMetadata(mints: string[], apiKey: string): Promise<any[]> {
  if (!mints.length) return [];
  
  try {
    const response = await fetch(`https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: mints.slice(0, 100) }) // Ограничиваем до 100
    });
    
    if (!response.ok) {
      console.error('Failed to fetch metadata:', response.status);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return [];
  }
}