const LABEL_OVERRIDES = {
  ayushHerbalProducts: "Ayush Herbal Products",
  b2bMeeting: "B2B Meeting",
  buyingProductsServices: "Buying Products Services",
  hospitalsHealthcareServices: "Hospitals Healthcare Services",
  organicNaturalProducts: "Organic Natural Products",
  rdInnovations: "R&D Innovations",
};

const TRUTHY_VALUES = new Set(["1", "on", "true", "yes"]);
const FALSY_VALUES = new Set(["0", "false", "no", "off"]);

const formatSelectionKey = (key) => {
  if (!key) return "";
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];

  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isTruthySelection = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (TRUTHY_VALUES.has(normalized)) return true;
    if (FALSY_VALUES.has(normalized)) return false;
  }

  return false;
};

const dedupeSelections = (values) => {
  const seen = new Set();

  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;

    seen.add(normalized);
    return true;
  });
};

const extractObjectLiteralSelections = (text) => {
  const selections = [];
  const matches = text.matchAll(
    /([A-Za-z][A-Za-z0-9_]*)\s*:\s*(true|false|"[^"]*"|'[^']*')/g,
  );

  for (const [, key, rawValue] of matches) {
    const cleanedValue = rawValue.replace(/^['"]|['"]$/g, "");
    const normalizedValue = cleanedValue.trim().toLowerCase();

    if (isTruthySelection(cleanedValue)) {
      selections.push(formatSelectionKey(key));
      continue;
    }

    if (
      key.toLowerCase().includes("other") &&
      cleanedValue.trim() &&
      !TRUTHY_VALUES.has(normalizedValue) &&
      !FALSY_VALUES.has(normalizedValue)
    ) {
      selections.push(cleanedValue.trim());
    }
  }

  return selections;
};

const normalizeSelectionList = (value) => {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return dedupeSelections(
      value.flatMap((item) => normalizeSelectionList(item)).filter(Boolean),
    );
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return [];

    if (
      (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) ||
      (trimmedValue.startsWith("{") && trimmedValue.endsWith("}"))
    ) {
      try {
        return normalizeSelectionList(JSON.parse(trimmedValue));
      } catch (error) {
        const extractedSelections = extractObjectLiteralSelections(trimmedValue);
        if (extractedSelections.length) {
          return dedupeSelections(extractedSelections);
        }
      }
    }

    if (trimmedValue.includes(",") && !trimmedValue.includes(":")) {
      return dedupeSelections(
        trimmedValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }

    if (/^[a-z][a-zA-Z0-9]+$/.test(trimmedValue) && /[A-Z]/.test(trimmedValue)) {
      return [formatSelectionKey(trimmedValue)];
    }

    return [trimmedValue];
  }

  if (typeof value === "object") {
    return dedupeSelections(
      Object.entries(value).flatMap(([key, entryValue]) => {
        if (entryValue == null) return [];

        if (
          typeof entryValue === "string" &&
          key.toLowerCase().includes("other") &&
          !isTruthySelection(entryValue) &&
          !FALSY_VALUES.has(entryValue.trim().toLowerCase())
        ) {
          return [entryValue.trim()];
        }

        if (Array.isArray(entryValue) || typeof entryValue === "object") {
          return normalizeSelectionList(entryValue);
        }

        return isTruthySelection(entryValue) ? [formatSelectionKey(key)] : [];
      }),
    );
  }

  return [];
};

const normalizeVisitorMultiSelectFields = (
  payload,
  fields = ["purposeOfVisit", "areaOfInterest"],
) => {
  if (!payload || typeof payload !== "object") return payload;

  const normalizedPayload = { ...payload };

  for (const field of fields) {
    if (field in normalizedPayload) {
      normalizedPayload[field] = normalizeSelectionList(normalizedPayload[field]);
    }
  }

  return normalizedPayload;
};

module.exports = {
  normalizeSelectionList,
  normalizeVisitorMultiSelectFields,
};
