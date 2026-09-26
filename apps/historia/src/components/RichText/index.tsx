import type React from 'react';
import { List } from '@eventuras/ratio-ui/core/List';
import { Link } from '@eventuras/ratio-ui-next';
import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  type JSXConvertersFunction,
  RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react';
import { ImageBlock } from '@/blocks/Image/Component';
import { headingConverter, internalDocToHref } from '@/lib/richtext/converters';
import type { ImageBlock as ImageBlockProps } from '@/payload-types';
import { cn } from '@/utilities/cn';

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ImageBlockProps>;

// Without a URL there is nothing to link to, so the text renders as it is.
const renderLink = (
  href: string | null | undefined,
  newTab: boolean | undefined,
  children: React.ReactNode,
) =>
  href ? (
    <Link href={href} {...(newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
      {children}
    </Link>
  ) : (
    children
  );

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...headingConverter,
  // Lexical's own converters emit classes (list-bullet, list-number) and bare <a>s that
  // nothing styles, so lists had no markers and links looked like body text.
  autolink: ({ node, nodesToJSX }) =>
    renderLink(node.fields.url, node.fields.newTab, nodesToJSX({ nodes: node.children })),
  link: ({ node, nodesToJSX }) =>
    renderLink(
      node.fields.linkType === 'internal' ? internalDocToHref({ linkNode: node }) : node.fields.url,
      node.fields.newTab,
      nodesToJSX({ nodes: node.children }),
    ),
  list: (args) => {
    // Checklists keep Lexical's rendering, which draws its own checkboxes.
    if (args.node.listType === 'check') {
      const { list } = defaultConverters;
      return typeof list === 'function' ? list(args) : null;
    }
    return (
      <List as={args.node.tag === 'ol' ? 'ol' : 'ul'} variant="markdown">
        {args.nodesToJSX({ nodes: args.node.children })}
      </List>
    );
  },
  blocks: {
    image: ({ node }: { node: SerializedBlockNode<ImageBlockProps> }) => (
      <ImageBlock {...node.fields} />
    ),
  },
});

type Props = {
  data: SerializedEditorState;
  enableGutter?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function RichText(props: Props) {
  const { className, enableGutter = false, ...rest } = props;
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters}
      className={cn({ container: enableGutter }, className)}
      {...rest}
    />
  );
}
