function unwrapList(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data;
  const nested = root.data;
  if (nested && typeof nested === 'object') {
    const data = nested as Record<string, unknown>;
    if (Array.isArray(data.docs)) return data.docs;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.materials)) return data.materials;
    if (Array.isArray(data.primaryTypes)) return data.primaryTypes;
  }
  if (Array.isArray(root.docs)) return root.docs;
  if (Array.isArray(root.materials)) return root.materials;
  if (Array.isArray(root.primaryTypes)) return root.primaryTypes;
  return [];
}

export function unwrapDataObject(
  body: unknown,
): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>;
  }
  return root;
}

export { unwrapList };
