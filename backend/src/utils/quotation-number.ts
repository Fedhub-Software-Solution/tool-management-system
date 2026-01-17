/**
 * Generate quotation number in format: QUOT-YYYY-XXX
 * Example: QUOT-2024-001
 */
export const generateQuotationNumber = async (
  getLatestQuotationNumber: () => Promise<string | null>
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `QUOT-${currentYear}-`;

  const latestNumber = await getLatestQuotationNumber();

  if (!latestNumber || !latestNumber.startsWith(prefix)) {
    // First quotation of the year
    return `${prefix}001`;
  }

  // Extract the sequence number from the latest quotation number
  const sequence = parseInt(latestNumber.slice(prefix.length), 10);

  if (isNaN(sequence)) {
    // Fallback if parsing fails
    return `${prefix}001`;
  }

  // Increment sequence and pad with zeros
  const nextSequence = (sequence + 1).toString().padStart(3, '0');

  return `${prefix}${nextSequence}`;
};

