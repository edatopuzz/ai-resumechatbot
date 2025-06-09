// ElevenLabs Speech-to-Text service
class SpeechToTextService {
  private apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;

  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Try different MIME types based on browser support
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      console.log('Using MIME type:', mimeType);

      // Create MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      this.audioChunks = [];
      this.isRecording = true;

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every 1 second for better chunks
      console.log('🎤 Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to access microphone. Please check permissions.');
    }
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          console.log('🎤 Recording stopped, processing audio...');
          
          // Create audio blob from chunks
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType });
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          console.log('Audio blob type:', audioBlob.type);
          
          // Check if audio is too small
          if (audioBlob.size < 1000) {
            throw new Error('Recording too short. Please speak for at least 1 second.');
          }
          
          // Convert to text using ElevenLabs
          const transcription = await this.transcribeAudio(audioBlob);
          
          // Clean up
          this.cleanup();
          
          resolve(transcription);
        } catch (error) {
          console.error('Error processing recording:', error);
          this.cleanup();
          reject(error);
        }
      };

      this.isRecording = false;
      this.mediaRecorder.stop();
      
      // Stop all tracks to release microphone
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      console.log('🔍 Original audio blob details:');
      console.log('- Size:', audioBlob.size, 'bytes');
      console.log('- Type:', audioBlob.type);
      console.log('- API Key present:', !!this.apiKey);

      // First, try sending the original audio format without conversion
      let processedBlob = audioBlob;
      let filename = 'recording.webm';

      // Only convert if it's not already a supported format
      if (!audioBlob.type.includes('wav') && !audioBlob.type.includes('mp3') && !audioBlob.type.includes('mp4')) {
        console.log('🔄 Converting audio format...');
        try {
          processedBlob = await this.convertToSupportedFormat(audioBlob);
          filename = 'recording.wav';
          console.log('✅ Audio converted successfully');
          console.log('- Converted size:', processedBlob.size, 'bytes');
          console.log('- Converted type:', processedBlob.type);
        } catch (conversionError) {
          console.warn('⚠️ Audio conversion failed, using original format:', conversionError);
          processedBlob = audioBlob;
          filename = 'recording.webm';
        }
      }

      // Validate audio size
      if (processedBlob.size < 100) {
        throw new Error('Audio file too small. Please record for at least 1 second.');
      }

      if (processedBlob.size > 25 * 1024 * 1024) { // 25MB limit
        throw new Error('Audio file too large. Please record a shorter message.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', processedBlob, filename);
      formData.append('model_id', 'scribe_v1');

      console.log('🚀 Sending to ElevenLabs STT API:');
      console.log('- File name:', filename);
      console.log('- File size:', processedBlob.size, 'bytes');
      console.log('- File type:', processedBlob.type);
      console.log('- Model ID:', 'scribe_v1');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });

      console.log('📡 API Response:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs STT API error details:');
        console.error('- Status:', response.status);
        console.error('- Status Text:', response.statusText);
        console.error('- Error Body:', errorText);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('- Parsed Error:', errorJson);
        } catch (e) {
          console.error('- Raw Error Text:', errorText);
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your ElevenLabs API key.');
        } else if (response.status === 422) {
          throw new Error(`Invalid audio format or content. Details: ${errorText}`);
        } else {
          throw new Error(`Speech-to-text API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Transcription completed successfully:');
      console.log('- Result:', result);
      console.log('- Text:', result.text);
      
      return result.text || '';
    } catch (error) {
      console.error('💥 Error in speech-to-text conversion:', error);
      throw error;
    }
  }

  private async convertToSupportedFormat(audioBlob: Blob): Promise<Blob> {
    try {
      // If it's already a supported format, return as is
      if (audioBlob.type.includes('wav') || audioBlob.type.includes('mp3') || audioBlob.type.includes('mp4')) {
        return audioBlob;
      }

      // Convert WebM/OGG to WAV using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBlob = this.audioBufferToWav(audioBuffer);
      console.log('Converted audio to WAV format');
      
      return wavBlob;
    } catch (error) {
      console.error('Error converting audio format:', error);
      // If conversion fails, try sending original blob
      return audioBlob;
    }
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private cleanup(): void {
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      this.cleanup();
      console.log('🎤 Recording cancelled');
    }
  }
}

// Export a singleton instance
export const speechToTextService = new SpeechToTextService();
export default speechToTextService; 