import type React from 'react';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Section } from '@eventuras/ratio-ui/layout/Section';
import { RenderBlocks } from '@/blocks/RenderBlocks';
import RichText from '@/components/RichText';
import type { InstructionSectionBlock as InstructionSectionBlockProps } from '@/payload-types';

export const InstructionSectionBlock: React.FC<InstructionSectionBlockProps> = ({
  title,
  description,
  sectionContent,
}) => {
  return (
    <Section>
      <Heading as="h2">{title}</Heading>
      {description && <RichText data={description} />}
      {sectionContent && sectionContent.length > 0 && <RenderBlocks blocks={sectionContent} />}
    </Section>
  );
};
