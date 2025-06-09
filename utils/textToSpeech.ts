// Simple client-side ElevenLabs integration with rate limiting
class TextToSpeechService {
  private apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests (faster with Turbo)
  
  // Test method with minimal text
  async testSpeak(): Promise<void> {
    console.log('🧪 Testing with minimal text...');
    await this.speak("Test", "XrExE9yKIg1WjnnlVkGX");
  }

  async speak(text: string, voiceId: string = "XrExE9yKIg1WjnnlVkGX"): Promise<HTMLAudioElement | void> {
    try {
      // Rate limiting: wait if we made a request too recently
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      console.log('🎤 Starting text-to-speech with ElevenLabs...');
      console.log('Voice ID:', voiceId);
      console.log('Text:', text.substring(0, 100) + '...');

      // Clean the text for better speech synthesis
      const cleanText = this.cleanTextForSpeech(text);

      this.lastRequestTime = Date.now();

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment before trying again. Your ElevenLabs plan may have usage limits.`);
        } else if (response.status === 401) {
          throw new Error(`Invalid API key. Please check your ElevenLabs API key.`);
        } else if (response.status === 422) {
          throw new Error(`Invalid voice ID or text. Voice ID: ${voiceId}`);
        } else {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }
      }

      console.log('✅ Audio generated successfully, playing...');
      
      // Convert response to audio and play
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio element
      const audio = new Audio(audioUrl);
      
      // Set up event listeners
      audio.onended = () => {
        console.log('🔊 Audio playback completed');
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onloadstart = () => {
        console.log('🎵 Audio started loading...');
      };
      audio.oncanplay = () => {
        console.log('🎵 Audio ready to play');
      };
      
      // Play the audio
      await audio.play();
      
      return audio;
    } catch (error) {
      console.error('❌ Error in text-to-speech:', error);
      
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Rate limit')) {
        alert('⏳ Rate limit reached! Please wait a moment before trying text-to-speech again. Your ElevenLabs plan may have usage limits.');
      } else {
        console.warn('Text-to-speech failed, but continuing without audio');
      }
      
      // Don't throw the error - just log it and continue
    }
  }

  private cleanTextForSpeech(text: string): string {
    // Remove markdown formatting and clean up text for better speech
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n+/g, '. ') // Replace line breaks with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Legacy method for compatibility
  setConvexAction(action: any) {
    console.log('Using direct ElevenLabs API instead of Convex');
  }
}

// Export a singleton instance
export const textToSpeechService = new TextToSpeechService();
export default textToSpeechService; 