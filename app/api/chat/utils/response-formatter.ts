// app/api/chat/utils/response-formatter.ts

/**
 * Formats markdown response for display
 */
export function formatMarkdownResponse(content: string): string {
  // Ensure proper spacing between sections
  return content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .trim();
}

/**
 * Sanitizes user input before processing
 */
export function sanitizeUserInput(input: string): string {
  return input.trim().substring(0, 10000); // Limit to 10k chars
}

/**
 * Generates a concise title from a message
 */
export function generateChatTitle(message: string): string {
  const cleaned = message.trim();
  
  if (cleaned.length <= 50) {
    return cleaned;
  }
  
  // Take first sentence or first 50 chars
  const firstSentence = cleaned.split(/[.!?]/)[0];
  
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence;
  }
  
  return cleaned.substring(0, 47) + '...';
}

/**
 * Formats error messages for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal errors to users
    if (error.message.includes('API')) {
      return 'Unable to connect to AI service. Please try again.';
    }
    if (error.message.includes('database')) {
      return 'Database connection error. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Validates attachment URLs
 */
export function validateAttachmentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow Supabase storage URLs (adjust to your domain)
    return parsed.hostname.includes('supabase.co');
  } catch {
    return false;
  }
}
