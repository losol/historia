/**
 * The plugin adds the event list block to the blocks fields of the collections
 * named, so a site does not have to thread it through its own block lists.
 */

import { Logger } from '@eventuras/logger';
import type { Config, Field } from 'payload';
import { EVENT_LIST_BLOCK_SLUG, EventListBlock } from './block';

const logger = Logger.create({
  namespace: 'payload-event-api-client',
  context: { module: 'EventApiClientPlugin' },
});

export interface EventApiClientPluginConfig {
  /** @default true */
  enabled?: boolean;
  /** The collections whose blocks fields get the block. @default ['pages'] */
  collections?: string[];
  /** The blocks fields to add the block to, by name. @default ['story'] */
  blocksFields?: string[];
}

/**
 * Adds the block to every matching blocks field, inside tabs, rows and groups
 * too. Returns how many fields matched, whether or not they already had it.
 */
function addBlock(fields: Field[], names: Set<string>): number {
  let matched = 0;
  for (const field of fields) {
    if (field.type === 'blocks' && names.has(field.name)) {
      matched++;
      if (!field.blocks.some((block) => block.slug === EVENT_LIST_BLOCK_SLUG)) {
        field.blocks.push(EventListBlock);
      }
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) matched += addBlock(tab.fields, names);
    } else if ('fields' in field && Array.isArray(field.fields)) {
      matched += addBlock(field.fields, names);
    }
  }
  return matched;
}

export function eventApiClientPlugin(pluginConfig: EventApiClientPluginConfig = {}) {
  return (incoming: Config): Config => {
    if (pluginConfig.enabled === false) {
      logger.info('Eventuras event list block is off');
      return incoming;
    }

    const collections = new Set(pluginConfig.collections ?? ['pages']);
    const names = new Set(pluginConfig.blocksFields ?? ['story']);

    let matched = 0;
    for (const collection of incoming.collections ?? []) {
      if (collections.has(collection.slug)) {
        matched += addBlock(collection.fields, names);
      }
    }

    if (matched === 0) {
      throw new Error(
        `eventApiClientPlugin found no blocks field named ${[...names].join(', ')} in ${[...collections].join(', ')}`,
      );
    }

    logger.info(
      { collections: [...collections], fields: matched },
      'Eventuras event list block is on',
    );
    return incoming;
  };
}
