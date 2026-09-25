'use client';

import { useEffect } from 'react';
import { Logger } from '@eventuras/logger';
import { RelationshipField, useField } from '@payloadcms/ui';
import type { RelationshipFieldClientComponent } from 'payload';

const logger = Logger.create({
  namespace: 'historia:orders',
  context: { module: 'ProductFieldWithPricePopulation' },
});

export const ProductFieldWithPricePopulation: RelationshipFieldClientComponent = (props) => {
  const { path } = props;

  // Use useField to monitor the product value and update other fields
  const { value: productValue } = useField({ path });

  // Get the form field updaters for price fields
  const priceAmountPath = path.replace('product', 'price.amountExVat');
  const priceCurrencyPath = path.replace('product', 'price.currency');
  const priceVatRatePath = path.replace('product', 'price.vatRate');

  const priceAmount = useField({ path: priceAmountPath });
  const priceCurrency = useField({ path: priceCurrencyPath });
  const priceVatRate = useField({ path: priceVatRatePath });

  // Watch for changes to the product field and populate price
  useEffect(() => {
    const populatePrice = async () => {
      // If a product was selected and price is not already set
      if (productValue && !priceAmount?.value) {
        try {
          const productId =
            typeof productValue === 'object' && 'value' in productValue
              ? productValue.value
              : productValue;

          // Fetch product details from Payload API
          const response = await fetch(`/api/products/${productId}?depth=0`, {
            credentials: 'include',
          });

          if (response.ok) {
            const product = await response.json();

            // Update price fields if product has price data
            if (product.price?.amountExVat && priceAmount?.setValue) {
              priceAmount.setValue(product.price.amountExVat);
            }
            if (product.price?.currency && priceCurrency?.setValue) {
              priceCurrency.setValue(product.price.currency);
            }
            if (product.price?.vatRate !== undefined && priceVatRate?.setValue) {
              priceVatRate.setValue(product.price.vatRate);
            } else if (priceVatRate?.setValue && !priceVatRate.value) {
              // Default to 25% if not set
              priceVatRate.setValue(25);
            }
          } else {
            logger.error({ productId, status: response.status }, 'Failed to fetch product');
          }
        } catch (error) {
          logger.error({ error }, 'Failed to fetch product data');
        }
      }
    };

    populatePrice();
  }, [productValue, priceAmount, priceCurrency, priceVatRate]);

  return <RelationshipField {...props} />;
};
