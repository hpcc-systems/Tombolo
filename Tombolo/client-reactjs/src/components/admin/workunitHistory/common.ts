export function flattenTree<T extends { children?: T[] }>(nodes?: T[] | null): T[] {
  const out: T[] = [];
  const visit = (arr?: T[] | null) =>
    arr?.forEach(n => {
      out.push(n);
      if (n.children) visit(n.children);
    });
  visit(nodes ?? null);
  return out;
}

export default flattenTree;
