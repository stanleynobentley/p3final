const selectors = ['article', 'main', '#content', '.content', '#main']

export const extractMainText = (doc: Document) => {
  const nodes = selectors
    .map((selector) => doc.querySelector(selector))
    .filter((node): node is Element => Boolean(node))

  const text = nodes
    .map((node) => node.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}
