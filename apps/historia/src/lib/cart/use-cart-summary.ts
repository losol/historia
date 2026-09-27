'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Logger } from '@eventuras/logger';
import { type CartSummary, calculateCart } from '@/app/(frontend)/[locale]/checkout/actions';
import type { CartItem } from './types';

const logger = Logger.create({
  namespace: 'historia:cart',
  context: { module: 'useCartSummary' },
});

/**
 * Prices for `items`, computed on the server, recomputed whenever the lines change.
 *
 * Only the answer to the latest request is kept: with several clicks in a row the
 * answers can arrive out of order, and an older one must not replace a newer one.
 * The previous summary stays on screen while a new one is computed, so the page does
 * not flash empty on every click. A failure is kept in `error` for the page to show,
 * with `retry` to try again. `upToDate` says whether the summary is for the lines
 * shown now; checkout waits for it.
 */
export function useCartSummary(items: CartItem[], enabled = true) {
  const [summary, setSummary] = useState<CartSummary | null>(null);
  // The lines `summary` was computed for.
  const [summaryKey, setSummaryKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);
  const [attempt, setAttempt] = useState(0);

  // One key per set of lines, so the effect runs when they change, not on every render.
  const key = items.map((item) => `${item.productId}:${item.quantity}`).join(',');

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands for `items`; `attempt` re-runs it on retry
  useEffect(() => {
    if (!enabled) return;

    const request = ++requestRef.current;

    if (items.length === 0) {
      setSummary(null);
      setSummaryKey(key);
      setError(false);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const result = await calculateCart(items);
        if (request !== requestRef.current) return;

        if (result.success) {
          setSummary(result.data);
          setSummaryKey(key);
          setError(false);
        } else {
          logger.error({ error: result.error, items }, 'Failed to price cart');
          setError(true);
        }
      } catch (loadError) {
        if (request !== requestRef.current) return;
        logger.error({ error: loadError, items }, 'Failed to price cart');
        setError(true);
      } finally {
        if (request === requestRef.current) setLoading(false);
      }
    }

    load();
  }, [key, enabled, attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  // False while the summary shown is for lines the customer has since changed.
  const upToDate = summaryKey === key;

  return { summary, loading, error, upToDate, retry };
}
