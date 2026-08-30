const nativeFetch = global.fetch;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

global.fetch = async function retryAwareFetch(input, init) {
  const url = typeof input === 'string' ? input : (input && input.url) || '';
  const isOpenRouterChat = url.includes('openrouter.ai/api/v1/chat/completions');

  if (!isOpenRouterChat) {
    return nativeFetch(input, init);
  }

  for (let gateAttempt = 1; gateAttempt <= 4; gateAttempt++) {
    const response = await nativeFetch(input, init);
    if (response.status !== 402) return response;

    let reason = '';
    try {
      const body = await response.clone().json();
      reason = body?.error?.metadata?.reason || '';
    } catch (_) {}

    if (reason !== 'in_flight_budget_exhausted') {
      return response;
    }

    const headerSeconds = Number(response.headers.get('retry-after'));
    const waitSeconds = Number.isFinite(headerSeconds) && headerSeconds > 0
      ? Math.min(180, Math.max(30, headerSeconds + 5))
      : 125;

    console.log(`OPENROUTER_BACKOFF gate_attempt=${gateAttempt} wait_seconds=${waitSeconds}`);
    await sleep(waitSeconds * 1000);
  }

  return nativeFetch(input, init);
};

require('./run-personas.js');
