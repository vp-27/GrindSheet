// Global animation state to track which animations have been shown this session
interface AnimationState {
  typewriterShown: Record<string, boolean>; // Track by message content hash
  sessionId: string;
}

class AnimationManager {
  private state: AnimationState;
  
  constructor() {
    this.state = {
      typewriterShown: {},
      sessionId: Date.now().toString()
    };
  }

  // Check if a typewriter animation has been shown for this text
  hasTypewriterBeenShown(text: string): boolean {
    const textHash = this.hashText(text);
    return this.state.typewriterShown[textHash] || false;
  }

  // Mark a typewriter animation as shown
  markTypewriterAsShown(text: string): void {
    const textHash = this.hashText(text);
    this.state.typewriterShown[textHash] = true;
  }

  // Simple hash function for text
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Reset all animations (useful for testing)
  reset(): void {
    this.state.typewriterShown = {};
  }
}

// Global instance
export const animationManager = new AnimationManager();
