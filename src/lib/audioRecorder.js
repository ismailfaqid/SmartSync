/**
 * Audio Recording and Real-Time Audio Spectrum Analyzer
 * Enhanced with continuous MediaRecorder chunking (no stop/start race conditions),
 * persistent Web Speech API auto-reconnect, and seamless overlap buffers.
 */
export class PodiumAudioEngine {
  constructor({ onChunkReady, onLiveSpeech, onError, onQuotaCheck }) {
    this.onChunkReady = onChunkReady
    this.onLiveSpeech = onLiveSpeech
    this.onError = onError
    this.onQuotaCheck = onQuotaCheck

    this.mediaStream = null
    this.mediaRecorder = null
    this.audioContext = null
    this.analyser = null
    this.sourceNode = null
    this.speechRecognition = null
    this.speechRecognitionAllowed = true

    this.isRecording = false
    this.chunkInterval = 30000 // 30 seconds
    this.intervalId = null
    this.animationFrameId = null

    // Chunk & speech buffering
    this.recordedBlobs = []
    this.recentOverlapBlobs = []
    this.currentChunkSpeechText = ''
    this.accumulatedSpeechText = ''
    this.recentTranscriptTail = ''
    this.recordingStartTime = null
    this.lastChunkTimestamp = null
    this.chunkSequence = 1
  }

  /**
   * Initializes audio input stream from the user's microphone
   */
  async start() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Setup Web Audio API Analyzer for live waveform rendering
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 64
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
        this.sourceNode.connect(this.analyser)
      }

      // Detect optimal supported audio MIME type
      let mimeType = 'audio/webm;codecs=opus'
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm'
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg'
          else mimeType = ''
        }
      }

      const options = mimeType ? { mimeType } : {}
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options)

      this.recordedBlobs = []
      this.recentOverlapBlobs = []
      this.currentChunkSpeechText = ''
      this.accumulatedSpeechText = ''
      this.recentTranscriptTail = ''
      this.recordingStartTime = Date.now()
      this.lastChunkTimestamp = Date.now()
      this.isRecording = true

      // Accumulate 1-second timeslices continuously
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data)
        }
      }

      // Start continuous streaming slices every 1s
      this.mediaRecorder.start(1000)

      // Cycle chunks every 30 seconds smoothly without stopping the hardware stream
      this.intervalId = setInterval(() => {
        if (!this.isRecording) return

        // Check quota limits
        if (this.onQuotaCheck && this.onQuotaCheck()) {
          console.warn('[Audio Engine] Quota limit reached. Pausing recording.')
          this.stop()
          return
        }

        this.emitChunk(false)
      }, this.chunkInterval)

      // Initialize Browser Speech-to-Text with auto-restart on pause
      this.initSpeechRecognition()

      return true
    } catch (err) {
      console.error('Microphone initialization error:', err)
      this.isRecording = false
      if (this.onError) this.onError(err)
      return false
    }
  }

  /**
   * Emits accumulated audio blobs and speech transcript as a processed chunk
   */
  emitChunk(isFinal = false) {
    if (this.recordedBlobs.length === 0 && !this.currentChunkSpeechText.trim() && !this.currentInterimText?.trim()) {
      return
    }

    const chunkBlobs = [...this.recordedBlobs]
    // Retain the last 15% of audio blobs as overlapping prefix for the next chunk
    if (!isFinal && chunkBlobs.length > 2) {
      const tailSliceCount = Math.max(1, Math.floor(chunkBlobs.length * 0.15))
      this.recentOverlapBlobs = chunkBlobs.slice(-tailSliceCount)
    } else {
      this.recentOverlapBlobs = []
    }

    // Reset recorded blobs for next interval
    this.recordedBlobs = []

    // Combine previous overlap with current chunk
    const combinedBlobs = [...this.recentOverlapBlobs, ...chunkBlobs]
    const blobType = this.mediaRecorder?.mimeType || 'audio/webm'
    const completeBlob = new Blob(combinedBlobs, { type: blobType })

    // Combine confirmed speech with any active in-flight interim speech
    const speechText = (this.currentChunkSpeechText + ' ' + (this.currentInterimText || '')).trim()
    this.currentChunkSpeechText = '' // Reset speech buffer for the next chunk
    this.currentInterimText = ''

    const now = Date.now()
    const durationSeconds = Math.max(
      5,
      Math.round((now - (this.lastChunkTimestamp || this.recordingStartTime || now)) / 1000)
    )
    this.lastChunkTimestamp = now

    if (this.onChunkReady) {
      this.onChunkReady({
        audioBlob: completeBlob,
        durationSeconds,
        sequenceNumber: this.chunkSequence++,
        previousTranscriptContext: this.recentTranscriptTail,
        speechTranscript: speechText,
        isFinal
      })
    }
  }

  /**
   * Initializes browser-native SpeechRecognition for live on-screen feedback
   * with automatic persistence and silence recovery
   */
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.info('[Audio Engine] Web SpeechRecognition API not supported in this browser.')
      return
    }

    try {
      this.speechRecognition = new SpeechRecognition()
      this.speechRecognition.continuous = true
      this.speechRecognition.interimResults = true
      this.speechRecognition.lang = 'en-US'
      this.speechRecognition.maxAlternatives = 1

      this.speechRecognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          const text = res[0]?.transcript || ''
          if (res.isFinal) {
            this.currentChunkSpeechText += ' ' + text.trim()
            this.accumulatedSpeechText += ' ' + text.trim()
            this.recentTranscriptTail = this.accumulatedSpeechText.slice(-200)
          } else {
            interim += ' ' + text.trim()
          }
        }

        this.currentInterimText = interim.trim()
        const previewText = (this.currentChunkSpeechText + ' ' + this.currentInterimText).trim()
        if (this.onLiveSpeech && previewText) {
          this.onLiveSpeech(previewText)
        }
      }

      this.speechRecognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          console.warn('[Speech Recognition] Permission denied:', e.error)
          this.speechRecognitionAllowed = false
        } else if (e.error !== 'no-speech') {
          console.warn('[Speech Recognition] Notice:', e.error)
        }
      }

      // CRITICAL FIX: Restart SpeechRecognition when silence or browser pause occurs!
      this.speechRecognition.onend = () => {
        if (this.isRecording && this.speechRecognitionAllowed) {
          try {
            this.speechRecognition.start()
          } catch (_) {
            // Already active or starting
          }
        }
      }

      this.speechRecognition.start()
    } catch (e) {
      console.warn('Could not initialize speech recognition:', e)
    }
  }

  /**
   * Stops recording and releases all audio tracks
   */
  stop() {
    this.isRecording = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Flush any remaining recorded speech & audio chunk before closing
    try {
      this.emitChunk(true)
    } catch (e) {
      console.warn('Error flushing final chunk on stop:', e)
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop()
      } catch (_) {}
      this.speechRecognition = null
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch (_) {}
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop())
      } catch (_) {}
      this.mediaStream = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close()
      } catch (_) {}
      this.audioContext = null
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Binds audio visualizer loop to an HTML5 Canvas element
   */
  attachVisualizer(canvasElement) {
    if (!canvasElement || !this.analyser) return

    const canvasCtx = canvasElement.getContext('2d')
    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!this.isRecording) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        canvasCtx.fillStyle = '#0f172a'
        canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height)
        return
      }

      this.animationFrameId = requestAnimationFrame(draw)
      this.analyser.getByteFrequencyData(dataArray)

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
      canvasCtx.fillStyle = '#0b1120'
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height)

      const barWidth = (canvasElement.width / bufferLength) * 2.2
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvasElement.height * 0.85

        const gradient = canvasCtx.createLinearGradient(0, canvasElement.height, 0, 0)
        gradient.addColorStop(0, '#10b981')
        gradient.addColorStop(0.6, '#06b6d4')
        gradient.addColorStop(1, '#38bdf8')

        canvasCtx.fillStyle = gradient
        canvasCtx.beginPath()
        canvasCtx.roundRect(x, canvasElement.height - barHeight - 2, barWidth - 2, barHeight + 2, [3, 3, 0, 0])
        canvasCtx.fill()

        x += barWidth + 1
      }
    }

    draw()
  }
}
