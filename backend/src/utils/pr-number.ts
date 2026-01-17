/**
 * Generate PR number in format: PR-YYYY-XXX
 * Example: PR-2024-001
 */
export const generatePRNumber = async (
  getLatestPRNumber: () => Promise<string | null>
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `PR-${currentYear}-`;

  const latestNumber = await getLatestPRNumber();

  if (!latestNumber || !latestNumber.startsWith(prefix)) {
    // First PR of the year
    return `${prefix}001`;
  }

  // Extract the sequence number from the latest PR number
  const sequence = parseInt(latestNumber.slice(prefix.length), 10);

  if (isNaN(sequence)) {
    // Fallback if parsing fails
    return `${prefix}001`;
  }

  // Increment sequence and pad with zeros
  const nextSequence = (sequence + 1).toString().padStart(3, '0');

  return `${prefix}${nextSequence}`;
};

