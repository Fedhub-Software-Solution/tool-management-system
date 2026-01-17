import prisma from '../config/database';

/**
 * Generate a unique handover number in format: HAND-YYYY-XXX
 * Example: HAND-2024-001
 */
export async function generateHandoverNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `HAND-${currentYear}-`;

  // Get the latest handover number for this year
  const latestHandover = await prisma.toolHandover.findFirst({
    where: {
      handoverNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      handoverNumber: 'desc',
    },
  });

  let sequence = 1;

  if (latestHandover) {
    // Extract sequence number from latest handover number
    const latestSequence = parseInt(
      latestHandover.handoverNumber.split('-').pop() || '0',
      10,
    );
    sequence = latestSequence + 1;
  }

  // Format sequence with leading zeros (3 digits)
  const formattedSequence = sequence.toString().padStart(3, '0');

  return `${prefix}${formattedSequence}`;
}

