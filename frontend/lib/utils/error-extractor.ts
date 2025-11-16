/**
 * Error extraction utility
 *
 * Extracts user-friendly error messages from various error types
 * including API errors, ValidationErrors, and plan limit errors
 */
import { APIError } from "./api-client";

/**
 * Extract a user-friendly error message from an error object
 */
export function extractErrorMessage(error: unknown): string {
  // Handle APIError instances
  if (error instanceof APIError) {
    return error.message;
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle objects with detail property (FastAPI ValidationError format)
  if (error && typeof error === "object") {
    // Check for FastAPI error format
    if ("detail" in error && typeof error.detail === "string") {
      return error.detail;
    }

    // Check for message property
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    // Check for data.detail (nested error responses)
    if (
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "detail" in error.data &&
      typeof error.data.detail === "string"
    ) {
      return error.data.detail;
    }

    // Check for response.detail (some fetch error formats)
    if (
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "detail" in error.response &&
      typeof error.response.detail === "string"
    ) {
      return error.response.detail;
    }
  }

  // Fallback to string representation
  if (typeof error === "string") {
    return error;
  }

  // Last resort
  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if an error is a plan limit error
 */
export function isPlanLimitError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes("limit") ||
    message.includes("reached") ||
    message.includes("maximum") ||
    message.includes("exceeded") ||
    message.includes("plan") ||
    message.includes("upgrade") ||
    message.includes("paid")
  );
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("cannot")
  );
}

/**
 * Format error title based on error type
 */
export function getErrorTitle(error: unknown): string {
  if (isPlanLimitError(error)) {
    return "Plan Limit Reached";
  }

  if (isValidationError(error)) {
    return "Validation Error";
  }

  return "Error";
}
