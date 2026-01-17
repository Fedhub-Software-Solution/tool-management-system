/**
 * Generate project number in format: PROJ-YYYY-XXX
 * Example: PROJ-2024-001
 */
export const generateProjectNumber = async (
  getLatestProjectNumber: () => Promise<string | null>
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `PROJ-${currentYear}-`;

  const latestNumber = await getLatestProjectNumber();

  if (!latestNumber || !latestNumber.startsWith(prefix)) {
    // First project of the year
    return `${prefix}001`;
  }

  // Extract the sequence number from the latest project number
  const sequence = parseInt(latestNumber.slice(prefix.length), 10);

  if (isNaN(sequence)) {
    // Fallback if parsing fails
    return `${prefix}001`;
  }

  // Increment sequence and pad with zeros
  const nextSequence = (sequence + 1).toString().padStart(3, '0');

  return `${prefix}${nextSequence}`;
};

