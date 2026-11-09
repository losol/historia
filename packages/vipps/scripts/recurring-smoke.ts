/** Opt-in apitest smoke test. Requires Recurring on the configured test sales unit. */
import { randomUUID } from 'node:crypto';
import {
  createAgreement,
  createCharge,
  forceAcceptAgreement,
  getAgreement,
  getCharge,
  updateAgreement,
} from '../src/recurring-v3';
import { vippsConfigFromEnv } from './env';

async function main(): Promise<void> {
  if (process.env.VIPPS_RECURRING_ENABLED !== 'true') {
    throw new Error(
      'Set VIPPS_RECURRING_ENABLED=true only after confirming Recurring is enabled on the test MSN.',
    );
  }
  const config = vippsConfigFromEnv('recurring-smoke');
  if (new URL(config.apiUrl).origin !== 'https://apitest.vipps.no') {
    throw new Error('This smoke script only runs against https://apitest.vipps.no');
  }
  const phoneNumber = process.env.VIPPS_TEST_PHONE_NUMBER;
  if (!phoneNumber) throw new Error('VIPPS_TEST_PHONE_NUMBER is required.');

  const agreement = await createAgreement(
    config,
    {
      pricing: { type: 'LEGACY', amount: 100, currency: 'NOK' },
      interval: { unit: 'MONTH', count: 1 },
      productName: 'Recurring smoke test',
      merchantRedirectUrl: 'https://example.com/recurring-return',
      merchantAgreementUrl: 'https://example.com/membership',
      phoneNumber,
      // Reserve only, so the test does not depend on direct-capture permission.
      initialCharge: {
        amount: 100,
        description: 'Smoke test initial charge',
        transactionType: 'RESERVE_CAPTURE',
      },
    },
    randomUUID(),
  );
  console.log('Created agreement:', agreement.agreementId);

  async function stopAgreement(): Promise<void> {
    // Stopping also cancels pending/reserved charges, including the initial reservation.
    await updateAgreement(config, agreement.agreementId, { status: 'STOPPED' }, randomUUID());
    const stopped = await getAgreement(config, agreement.agreementId);
    if (stopped.status !== 'STOPPED') throw new Error(`Expected STOPPED, got ${stopped.status}`);
    console.log('Stopped agreement and canceled outstanding charges:', agreement.agreementId);
  }

  try {
    if (process.env.VIPPS_RECURRING_FORCE_ACCEPT === 'false') {
      console.log('Accept in the test app within two minutes:', agreement.vippsConfirmationUrl);
    } else {
      await forceAcceptAgreement(config, agreement.agreementId, { phoneNumber }, randomUUID());
    }

    let active = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const details = await getAgreement(config, agreement.agreementId);
      if (details.status === 'ACTIVE') {
        active = true;
        break;
      }
      if (details.status === 'STOPPED' || details.status === 'EXPIRED') {
        throw new Error(`Agreement reached ${details.status} instead of ACTIVE.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!active) throw new Error('Timed out waiting for ACTIVE.');
    if (agreement.chargeId) {
      const initial = await getCharge(config, agreement.agreementId, agreement.chargeId);
      console.log('Initial charge status:', initial.status);
    }

    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 2);
    const charge = await createCharge(
      config,
      agreement.agreementId,
      {
        amount: 100,
        description: 'Smoke test recurring charge',
        due: due.toISOString().slice(0, 10),
        retryDays: 2,
        type: 'RECURRING',
        transactionType: 'RESERVE_CAPTURE',
      },
      randomUUID(),
    );
    const details = await getCharge(config, agreement.agreementId, charge.chargeId);
    console.log('Created recurring charge:', charge.chargeId, details.status);
  } finally {
    await stopAgreement().catch(() => {
      console.error(
        'Cleanup failed. Stop the agreement in the test portal:',
        agreement.agreementId,
      );
      process.exitCode = 1;
    });
  }
}

main().catch(() => {
  // Upstream errors can contain personal data. Keep the CLI output free of it.
  console.error(
    'Recurring smoke failed. Check test configuration and the agreement in the test portal.',
  );
  process.exitCode = 1;
});
