// src/lib/errors.ts
export type ErrorCode = 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'SERVER' | 'TIMEOUT' | 'ABORT';

export class ChatApiError extends Error {
  public status: number;
  public code: ErrorCode;
  public canRetry: boolean;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    canRetry: boolean = false
  ) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.code = code;
    this.canRetry = canRetry;
  }

  static fromResponse(status: number, detail?: string): ChatApiError {
    switch (status) {
      case 401:
        return new ChatApiError(401, 'AUTH', detail || 'API認証エラー。APIキーを確認してください。', false);
      case 429:
        return new ChatApiError(429, 'RATE_LIMIT', 'レート制限に達しました。しばらく待ってから再試行してください。', true);
      case 500:
      case 502:
      case 503:
        return new ChatApiError(status, 'SERVER', detail || 'サーバーエラーが発生しました。', true);
      case 408:
        return new ChatApiError(408, 'TIMEOUT', 'リクエストがタイムアウトしました。', true);
      default:
        return new ChatApiError(status, 'SERVER', detail || `HTTPエラー: ${status}`, status >= 500);
    }
  }

  static network(message?: string): ChatApiError {
    return new ChatApiError(0, 'NETWORK', message || 'ネットワークエラー。接続を確認してください。', true);
  }

  static abort(): ChatApiError {
    return new ChatApiError(0, 'ABORT', 'リクエストが中断されました。', false);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // 429の場合はRetry-Afterを見る
      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 500系エラーでリトライ可能
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;

      // AbortErrorはリトライしない
      if (err instanceof Error && err.name === 'AbortError') {
        throw ChatApiError.abort();
      }

      // ネットワークエラーでリトライ
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  throw ChatApiError.network(lastError?.message);
}
