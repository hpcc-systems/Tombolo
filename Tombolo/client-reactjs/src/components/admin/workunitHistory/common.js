function flattenTree(nodes) {
  const out = [];
  const visit = arr =>
    arr?.forEach(n => {
      out.push(n);
      if (n.children) visit(n.children);
    });
  visit(nodes);
  return out;
}

export { flattenTree };