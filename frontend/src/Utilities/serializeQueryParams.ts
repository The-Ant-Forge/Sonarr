// Replaces jQuery's $.param(obj, traditional=true).
// Serializes an object to a query string with traditional array handling
// (repeated keys rather than key[] notation).

export default function serializeQueryParams(
  params: Record<string, unknown>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}
