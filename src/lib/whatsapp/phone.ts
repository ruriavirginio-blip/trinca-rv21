export function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function onlyDigits(value: unknown) {
  return cleanText(value).replace(/\D/g, "");
}

export function normalizeBrazilianWhatsapp(value: unknown) {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function brazilianWhatsappVariants(value: unknown) {
  const digits = normalizeBrazilianWhatsapp(value);
  const variants = new Set<string>();

  if (!digits) {
    return [];
  }

  variants.add(digits);

  if (digits.startsWith("55") && digits.length === 13 && digits[4] === "9") {
    variants.add(`${digits.slice(0, 4)}${digits.slice(5)}`);
  }

  if (digits.startsWith("55") && digits.length === 12) {
    variants.add(`${digits.slice(0, 4)}9${digits.slice(4)}`);
  }

  return [...variants];
}

export function sameBrazilianWhatsapp(left: unknown, right: unknown) {
  const rightDigits = normalizeBrazilianWhatsapp(right);

  if (!rightDigits) {
    return false;
  }

  return brazilianWhatsappVariants(left).includes(rightDigits);
}
