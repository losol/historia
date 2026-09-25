import { Logger } from '@eventuras/logger';
import type { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types';

const logger = Logger.create({
  namespace: 'historia:search',
  context: { module: 'beforeSync' },
});

export const beforeSyncWithSearch: BeforeSync = async ({ originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc;

  const { slug, id, topics, title, meta } = originalDoc;

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    meta: {
      ...meta,
      title: meta?.title || title,
      image: meta?.image?.id || meta?.image,
      description: meta?.description,
    },
    topics: [],
  };

  if (topics && Array.isArray(topics) && topics.length > 0) {
    // get full topics and keep a flattened copy of their most important properties
    try {
      const mappedTopics = topics.map((topic) => {
        const { id, title } = topic;

        return {
          relationTo: 'topics',
          id,
          title,
        };
      });

      modifiedDoc.topics = mappedTopics;
    } catch (err) {
      logger.error(
        { error: err, collection, id },
        'Topic not found when syncing document to search',
      );
    }
  }

  return modifiedDoc;
};
