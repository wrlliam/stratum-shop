/**
 * Centralized error code → human-readable message mapping.
 * API routes should return { error: string, code: string } shapes.
 * Client-side error handlers should use getErrorMessage() for toast messages.
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  UNAUTHORIZED: 'You need to be signed in to do that.',
  FORBIDDEN: 'You don\'t have permission to do that.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',

  // Orders
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_ALREADY_REFUNDED: 'This order has already been refunded.',
  ORDER_NOT_REFUNDABLE: 'This order cannot be refunded in its current state.',
  REFUND_FAILED: 'The refund could not be processed. Please try again.',
  NO_PAYMENT_INTENT: 'No payment information found for this order.',

  // Cart / Checkout
  PRODUCT_NOT_FOUND: 'One or more products in your cart could not be found.',
  OUT_OF_STOCK: 'Sorry, this item is out of stock.',
  INSUFFICIENT_STOCK: 'Not enough stock available for the requested quantity.',
  CART_EMPTY: 'Your cart is empty.',

  // Coupons
  COUPON_NOT_FOUND: 'This coupon code does not exist.',
  COUPON_EXPIRED: 'This coupon has expired.',
  COUPON_INACTIVE: 'This coupon is no longer active.',
  COUPON_MAX_USES: 'This coupon has reached its maximum number of uses.',
  COUPON_MIN_ORDER: 'Your order does not meet the minimum amount for this coupon.',
  COUPON_PRODUCT_RESTRICTION: 'This coupon is not valid for the items in your cart.',
  COUPON_CONDITION_FAILED: 'You do not meet the requirements for this coupon.',

  // Upload
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  INVALID_FILE_TYPE: 'This file type is not supported.',
  FILE_TOO_LARGE: 'The file is too large. Maximum size is 10MB.',

  // Support
  TICKET_NOT_FOUND: 'Support ticket not found.',
  TICKET_CLOSED: 'This support ticket is closed.',

  // Generic
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
}

/**
 * Get a human-readable message for an error code.
 * Falls back to the raw error string if no mapping exists.
 */
export function getErrorMessage(codeOrMessage: string): string {
  return ERROR_MESSAGES[codeOrMessage] ?? codeOrMessage ?? ERROR_MESSAGES.SERVER_ERROR
}

/**
 * Parse an API response error and return a human-readable message.
 */
export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data.code) return getErrorMessage(data.code)
    if (data.error) return data.error
  } catch {
    // Response not JSON
  }
  return ERROR_MESSAGES.SERVER_ERROR
}
