const isBlank = (value) => {
  if (value === undefined || value === null) return true;
  const text = String(value).trim();
  return !text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null";
};

const cleanText = (value, fallback = "System action performed") => {
  if (isBlank(value)) return fallback;

  const text = String(value)
    .replace(/\b(undefined|null)\b/gi, "")
    .replace(/\bfor company\s*([,.])/gi, "$1")
    .replace(/\b(for|by|against|from|to)\s+([,.])/gi, "$2")
    .replace(/\s+([,.)])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\(\s*\)/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .trim()
    .replace(/^[-:,.\s]+|[-:,.\s]+$/g, "");

  return text || fallback;
};

const labelize = (key) =>
  String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const flattenObject = (value, prefix = "") => {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanText(typeof item === "object" ? formatDetails(item, "") : item, ""))
      .filter(Boolean);
  }

  return Object.entries(value).flatMap(([key, entry]) => {
    if (isBlank(entry)) return [];
    const label = prefix ? `${prefix} ${labelize(key)}` : labelize(key);

    if (entry && typeof entry === "object") {
      return flattenObject(entry, label);
    }

    return [`${label}: ${cleanText(entry, "")}`];
  });
};

const formatDetails = (details, fallback = "System action performed") => {
  if (details && typeof details === "object") {
    const preferred = details.details || details.message || details.description || details.title;
    if (!isBlank(preferred) && typeof preferred !== "object") {
      return cleanText(preferred, fallback);
    }

    return cleanText(flattenObject(details).join(", "), fallback);
  }

  if (typeof details === "string") {
    const trimmed = details.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return formatDetails(JSON.parse(trimmed), fallback);
      } catch (error) {
        return cleanText(trimmed, fallback);
      }
    }
  }

  return cleanText(details, fallback);
};

module.exports = {
  cleanText,
  formatDetails,
  isBlank,
};
