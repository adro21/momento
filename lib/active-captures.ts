const activeCaptures = new Map<string, AbortController>();

export function registerCapture(sessionId: string): AbortController {
  const controller = new AbortController();
  activeCaptures.set(sessionId, controller);
  return controller;
}

export function cancelCapture(sessionId: string): boolean {
  const controller = activeCaptures.get(sessionId);
  if (controller) {
    controller.abort();
    activeCaptures.delete(sessionId);
    return true;
  }
  return false;
}

export function removeCapture(sessionId: string): void {
  activeCaptures.delete(sessionId);
}
