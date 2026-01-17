import prisma from '../config/database';

/**
 * Generate a unique request number in format: REQ-YYYY-XXX
 * Example: REQ-2024-001
 */
export async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `REQ-${currentYear}-`;

  // Get the latest request number for this year
  const latestRequest = await prisma.sparesRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      requestNumber: 'desc',
    },
  });

  let sequence = 1;

  if (latestRequest) {
    // Extract sequence number from latest request number
    const latestSequence = parseInt(
      latestRequest.requestNumber.split('-').pop() || '0',
      10,
    );
    sequence = latestSequence + 1;
  }

  // Format sequence with leading zeros (3 digits)
  const formattedSequence = sequence.toString().padStart(3, '0');

  return `${prefix}${formattedSequence}`;
}

