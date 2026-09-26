'use client';

import { useEffect, useRef, useState } from 'react';
import { Logger } from '@eventuras/logger';
import { LiveIndicator } from '@eventuras/ratio-ui/core/LiveIndicator';
import { useToast } from '@eventuras/ratio-ui/toast';

const logger = Logger.create({
  namespace: 'historia:payment',
  context: { module: 'PaymentStatusSSE' },
});

interface PaymentStatusProps {
  reference: string;
  onStatusChange?: (status: string) => void;
}

interface PaymentStatusUpdate {
  status: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
  timeout?: boolean;
  failureReason?: string;
}

/**
 * Client component that uses Server-Sent Events (SSE) to listen for
 * payment status updates in real-time.
 *
 * Connects to /api/payment/[reference]/events endpoint which polls
 * the transaction status and sends updates via SSE.
 */
export function PaymentStatusSSE({ reference, onStatusChange }: Readonly<PaymentStatusProps>) {
  const toast = useToast();
  const [status, setStatus] = useState<string>('pending');
  const eventSourceRef = useRef<EventSource | null>(null);
  const isConnectedRef = useRef(false);
  // Mirrors `status` for the SSE handlers. Reading the state directly would mean
  // depending on it, and every status update would then reopen the connection.
  const statusRef = useRef('pending');

  useEffect(() => {
    // Prevent duplicate connections
    if (isConnectedRef.current) {
      logger.debug({ reference }, 'SSE already connected, skipping');
      return;
    }
    isConnectedRef.current = true;

    logger.info({ reference }, 'Opening SSE connection for payment status');

    // Create EventSource connection
    const eventSource = new EventSource(`/api/payment/${reference}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      logger.debug({ reference }, 'SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: PaymentStatusUpdate = JSON.parse(event.data);

        logger.info({ reference, data }, 'Received payment status update');

        // Handle timeout
        if (data.timeout) {
          logger.warn({ reference }, 'SSE connection timeout');
          toast.info('Payment status check timed out. Please refresh the page.');
          eventSource.close();
          return;
        }

        // Handle error
        if (data.error) {
          logger.error({ reference, error: data.error }, 'Payment status error');
          toast.error(data.error);
          statusRef.current = 'error';
          setStatus('error');
          onStatusChange?.('error');
          eventSource.close();
          return;
        }

        // Handle status update
        if (data.status) {
          statusRef.current = data.status;
          setStatus(data.status);

          // Failures are reported once further down, with the reason attached.
          // Reporting them here too made the parent handle every failure twice.
          const isFailure = data.status === 'failed' || data.status === 'cancelled';

          if (!isFailure) {
            onStatusChange?.(data.status);
          }

          // Handle successful payment
          if (data.status === 'captured' || data.status === 'completed') {
            logger.info({ reference, orderId: data.orderId }, 'Payment successful');
            toast.success('Betaling fullført!');
            eventSource.close();
          }

          // Handle failed payment - pass failureReason via status string
          if (isFailure) {
            logger.warn(
              { reference, status: data.status, failureReason: data.failureReason },
              'Payment failed',
            );

            // Pass failure reason to parent via status callback (format: "failed:reason")
            const statusWithReason = data.failureReason
              ? `failed:${data.failureReason}`
              : data.status;
            onStatusChange?.(statusWithReason);

            toast.error('Betaling feilet');
            eventSource.close();
          }
        }
      } catch (error) {
        logger.error({ reference, error }, 'Failed to parse SSE message');
      }
    };

    eventSource.onerror = (error) => {
      logger.error({ reference, error }, 'SSE connection error');
      eventSource.close();

      // Don't show error toast if we already have a status
      if (statusRef.current === 'pending') {
        toast.error('Mistet forbindelse til server. Vennligst last siden på nytt.');
      }
    };

    // Cleanup on unmount
    return () => {
      logger.debug({ reference }, 'Closing SSE connection');
      eventSource.close();
      isConnectedRef.current = false;
    };
  }, [reference, onStatusChange, toast]);

  return (
    <LiveIndicator status="live">
      Venter på betaling...
      {status !== 'pending' && ` (Status: ${status})`}
    </LiveIndicator>
  );
}
