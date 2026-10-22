import { DocTeaser, type TeaserCollection, type TeaserDocument } from '@/components/Teaser';
import styles from './CollectionArchive.module.css';

export type ArchiveDocument = TeaserDocument;

type CollectionArchiveProps = {
  docs: ArchiveDocument[];
  relationTo: TeaserCollection;
  locale: string;
  showImages?: boolean;
};

/** A grid of teasers, one per document. */
export const CollectionArchive = ({
  docs,
  relationTo,
  locale,
  showImages = true,
}: CollectionArchiveProps) => {
  return (
    <div className={styles.grid}>
      {docs?.map((doc) => (
        <DocTeaser
          key={doc.id}
          doc={doc}
          relationTo={relationTo}
          locale={locale}
          showImage={showImages}
        />
      ))}
    </div>
  );
};
