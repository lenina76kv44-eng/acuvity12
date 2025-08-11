// Временный файл для отладки переменных окружения
console.log('=== Environment Variables Debug ===');
console.log('HELIUS_API_KEY:', process.env.HELIUS_API_KEY ? 'SET' : 'MISSING');
console.log('BAGS_API_KEY:', process.env.BAGS_API_KEY ? 'SET' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('HELIUS') || k.includes('BAGS')));