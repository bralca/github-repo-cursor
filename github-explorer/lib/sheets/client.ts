'use client';

/**
 * A client-side utility for managing sheet UI components
 */
export const sheets = {
  /**
   * Toggle the visibility of sheets panel
   */
  toggle: () => {
    // This would normally dispatch an event or update state
    // For now it's a placeholder to satisfy the interface
    const event = new CustomEvent('toggle-sheets');
    document.dispatchEvent(event);
  }
}; 