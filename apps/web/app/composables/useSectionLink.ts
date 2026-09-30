export const SECTIONS = ['features', 'how', 'ai', 'pro', 'faq'] as const;
export type SectionId = (typeof SECTIONS)[number] | 'download';

export function useSectionLink() {
  const localePath = useLocalePath();
  return (id: SectionId) => ({ path: localePath('/'), hash: `#${id}` });
}
