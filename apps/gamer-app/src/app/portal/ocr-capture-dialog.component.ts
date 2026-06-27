import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Tesseract from 'tesseract.js';
import { environment } from '../../environments/environment';

export interface CaptureResult {
  game: string;
  score: number;
  result: string;
}

type DialogMode = 'capture' | 'result';
type CaptureMode = 'camera' | 'upload';

@Component({
  selector: 'app-ocr-capture-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-800/95">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📸</span>
            <h2 class="text-xl font-bold text-white">Capture Game Result</h2>
          </div>
          <button
            (click)="onClose()"
            type="button"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <span class="text-2xl">✕</span>
          </button>
        </div>

        <div class="p-4 sm:p-6">
          <!-- Mode Selection - Radio Buttons - Only show when not viewing results -->
          @if (!showOcrResults()) {
            <div class="mb-6 space-y-3">
              <p class="text-slate-300 text-sm font-semibold">How to capture result:</p>
              <div class="space-y-2">
                <!-- Camera Option -->
                <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  [ngClass]="mode() === 'camera'
                    ? 'bg-cyan-600/20 border border-cyan-500/50'
                    : 'bg-slate-700/30 border border-white/10 hover:bg-slate-700/50'"
                >
                  <input
                    type="radio"
                    name="capture-mode"
                    value="camera"
                    [checked]="mode() === 'camera'"
                    (change)="setMode('camera')"
                    class="w-5 h-5 cursor-pointer"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="text-white font-semibold">📷 Camera</span>
                    <p class="text-slate-400 text-xs">Use your device camera</p>
                  </div>
                </label>

                <!-- Upload Option -->
                <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  [ngClass]="mode() === 'upload'
                    ? 'bg-cyan-600/20 border border-cyan-500/50'
                    : 'bg-slate-700/30 border border-white/10 hover:bg-slate-700/50'"
                >
                  <input
                    type="radio"
                    name="capture-mode"
                    value="upload"
                    [checked]="mode() === 'upload'"
                    (change)="setMode('upload')"
                    class="w-5 h-5 cursor-pointer"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="text-white font-semibold">📤 Upload</span>
                    <p class="text-slate-400 text-xs">Upload an existing image</p>
                  </div>
                </label>
              </div>
            </div>
          }

          <!-- Show capture/upload only if not viewing results -->
          @if (!showOcrResults()) {
            <!-- Camera Mode -->
            @if (mode() === 'camera') {
              <div class="space-y-3 sm:space-y-4">
                @if (!cameraActive()) {
                  <button
                    (click)="startCamera()"
                    [disabled]="isProcessing()"
                    class="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all text-sm sm:text-base"
                  >
                    🎥 Start Camera
                  </button>
                } @else {
                  <div class="space-y-3">
                    <video
                      #videoElement
                      autoplay
                      playsinline
                      class="w-full rounded-lg bg-black aspect-video object-cover">
                    </video>
                    <canvas #canvasElement style="display: none;"></canvas>
                    <div class="flex gap-2">
                      <button
                        (click)="captureFrame()"
                        [disabled]="isProcessing()"
                        class="flex-1 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all text-sm sm:text-base"
                      >
                        ✓ Capture
                      </button>
                      <button
                        (click)="stopCamera()"
                        class="flex-1 py-3 sm:py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Upload Mode -->
            @if (mode() === 'upload') {
              <div class="space-y-3 sm:space-y-4">
                <label class="block">
                  <div class="border-2 border-dashed border-cyan-400/50 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-cyan-400 transition-colors active:bg-cyan-400/10">
                    <div class="text-4xl sm:text-5xl mb-2">📁</div>
                    <p class="text-white font-semibold mb-1 text-sm sm:text-base">Tap to upload or drag and drop</p>
                    <p class="text-slate-400 text-xs sm:text-sm">PNG, JPG, or GIF (max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onFileSelected($event)"
                    [disabled]="isProcessing()"
                    class="hidden"
                  />
                </label>
              </div>
            }

            <!-- OCR Processing Progress -->
            @if (isProcessing()) {
              <div class="space-y-3 mt-6">
                <div class="flex items-center justify-between">
                  <p class="text-white font-semibold">Processing image...</p>
                  <span class="text-cyan-400">{{ ocrProgress() }}%</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                  <div
                    class="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all"
                    [style.width.%]="ocrProgress()">
                  </div>
                </div>
              </div>
            }
          }

          <!-- OCR Results Preview -->
          @if (showOcrResults()) {
            <div class="space-y-3 sm:space-y-4">
              <div class="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 sm:p-4">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-cyan-300 text-xs sm:text-sm font-semibold">📊 OCR Results Detected</p>
                  <span class="text-cyan-400 text-xs font-medium">{{ detectedFields().length }} field{{ detectedFields().length !== 1 ? 's' : '' }}</span>
                </div>
                @if (detectedFields().length > 0) {
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    @for (field of detectedFields(); track field.label) {
                      <div class="bg-slate-700/50 hover:bg-slate-600 rounded-lg p-2 sm:p-3 transition-colors border border-transparent hover:border-cyan-400/30">
                        <p class="text-slate-400 text-xs font-semibold mb-1 truncate">{{ field.label }}</p>
                        <p class="text-white font-bold text-sm sm:text-base break-words line-clamp-2 text-center">{{ field.value }}</p>
                      </div>
                    }
                  </div>
                  <p class="text-slate-400 text-xs mt-2">{{ detectedFields().length }} field{{ detectedFields().length !== 1 ? 's' : '' }} extracted from image. Edit core values below if needed.</p>
                } @else {
                  <p class="text-slate-400 text-xs sm:text-sm">No data detected. Please review and manually enter values below.</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- Result Form / Preview -->
        @if (showOcrResults()) {
          <div class="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            <div class="border-t border-white/10 pt-4">
              <h3 class="text-white font-semibold mb-4 text-base sm:text-lg">✏️ Edit Results (Optional)</h3>
            </div>

            <!-- Game Name -->
            <div>
              <label for="game" class="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">Game Name</label>
              <input
                id="game"
                [(ngModel)]="formData.game"
                type="text"
                placeholder="Game name"
                class="w-full px-4 py-3 text-base bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
              />
            </div>

            <!-- Score -->
            <div>
              <label for="score" class="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">Score</label>
              <input
                id="score"
                [(ngModel)]="formData.score"
                type="number"
                class="w-full px-4 py-3 text-base bg-slate-700/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <!-- Result -->
            <div>
              <label for="result" class="block text-xs sm:text-sm text-slate-300 mb-2 font-medium">Result</label>
              <select
                id="result"
                [(ngModel)]="formData.result"
                class="w-full px-4 py-3 text-base bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
              >
                <option value="">Select result...</option>
                <option value="win">Win 🏆</option>
                <option value="loss">Loss 😔</option>
                <option value="draw">Draw 🤝</option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                (click)="resetAndCapture()"
                type="button"
                class="w-full sm:flex-1 px-4 py-3 sm:py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                ← Capture Again
              </button>
              <button
                (click)="onSave()"
                [disabled]="!formData.game || isSaving()"
                type="button"
                class="w-full sm:flex-1 px-4 py-3 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                @if (isSaving()) {
                  <span class="animate-spin">⟳</span>
                  <span>Saving...</span>
                } @else {
                  <span>✓</span>
                  <span>Save & Continue</span>
                }
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class OcrCaptureDialogComponent implements OnDestroy {
  @Input() sessionGame = 'Game Name';
  @Input() sessionId = '';
  @Output() save = new EventEmitter<CaptureResult>();
  @Output() closeDialog = new EventEmitter<void>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  mode = signal<CaptureMode>('upload');
  cameraActive = signal(false);
  isProcessing = signal(false);
  ocrProgress = signal(0);
  showOcrResults = signal(false);
  detectedFields = signal<Array<{ label: string; value: string }>>([]);
  isSaving = signal(false);

  formData = {
    game: '',
    score: 0,
    result: '',
  };

  private mediaStream: MediaStream | null = null;
  private capturedImageData: string = '';

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setMode(newMode: CaptureMode): void {
    if (newMode === 'camera' && this.mode() !== 'camera') {
      this.stopCamera();
    }
    this.mode.set(newMode);
  }

  async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.cameraActive.set(true);

      setTimeout(() => {
        if (this.videoElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start camera:', err);
      alert('Could not access camera. Please check permissions.');
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  captureFrame(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const canvas = this.canvasElement.nativeElement;
    const video = this.videoElement.nativeElement;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      this.runOcr(imageData);
      this.stopCamera();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        this.runOcr(imageData);
      };
      reader.readAsDataURL(file);
    }
  }

  private async runOcr(imageSource: string): Promise<void> {
    this.isProcessing.set(true);
    this.ocrProgress.set(0);
    this.capturedImageData = imageSource;

    try {
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
        logger: (m) => {
          this.ocrProgress.set(Math.round(m.progress * 100));
        },
      });

      this.parseOcrText(text);
      this.showOcrResults.set(true);
    } catch (err) {
      console.error('OCR error:', err);
      alert('Failed to process image. Please try again.');
    } finally {
      this.isProcessing.set(false);
      this.ocrProgress.set(0);
    }
  }

  private compressImage(imageData: string, quality: number = 0.7): Promise<string> {
    return new Promise<string>((resolve) => {
      try {
        const img = new Image();
        img.src = imageData;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageData);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } catch {
            resolve(imageData);
          }
        };
        img.onerror = () => resolve(imageData);
      } catch {
        resolve(imageData);
      }
    });
  }

  private parseOcrText(text: string): void {
    const normalized = text.toLowerCase();
    const detectedFields: Array<{ label: string; value: string }> = [];
    const processedTexts = new Set<string>();

    // Common stop words to filter out
    const stopWords = new Set([
      'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'by', 'from', 'with', 'as', 'if', 'but', 'so',
      'that', 'which', 'who', 'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
      'both', 'either', 'neither', 'any', 'some', 'no', 'nor', 'not', 'only', 'own', 'same',
      'than', 'then', 'too', 'very', 'just', 'also', 'more', 'most', 'less', 'least', 'such',
      'its', 'your', 'his', 'her', 'their', 'my', 'our', 'this', 'that', 'these', 'those'
    ]);

    // Auto-detect result if present
    if (normalized.includes('win') || normalized.includes('victory') || normalized.includes('winner') || normalized.includes('won')) {
      this.formData.result = 'win';
    } else if (normalized.includes('loss') || normalized.includes('defeat') || normalized.includes('lost') || normalized.includes('lose')) {
      this.formData.result = 'loss';
    } else if (normalized.includes('draw') || normalized.includes('tie') || normalized.includes('tied')) {
      this.formData.result = 'draw';
    }

    // Extract all key-value pairs (Label: Value format)
    const keyValueRegex = /([a-zA-Z0-9\s]+)[:\s=]+([^\n:]+)/g;
    let kvMatch;

    while ((kvMatch = keyValueRegex.exec(text)) !== null) {
      const label = kvMatch[1].trim();
      const value = kvMatch[2].trim();

      // Validation checks
      if (label.length < 2 || label.length > 40) continue;
      if (!value || value.length === 0 || value.length > 60) continue;
      if (processedTexts.has(label.toLowerCase())) continue;
      if (stopWords.has(label.toLowerCase())) continue;

      // Normalize and add field
      const normalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      detectedFields.push({ label: normalizedLabel, value });
      processedTexts.add(label.toLowerCase());
    }

    // Extract all individual words (capitalized or with numbers)
    const wordRegex = /\b[A-Z][a-zA-Z]*\b|\b[a-zA-Z]+\s[a-zA-Z]+\b/g;
    let wordMatch;

    while ((wordMatch = wordRegex.exec(text)) !== null) {
      const word = wordMatch[0].trim();

      // Skip if already processed or is a stop word
      if (processedTexts.has(word.toLowerCase()) || stopWords.has(word.toLowerCase())) continue;
      if (word.length < 2 || word.length > 30) continue;

      // Add as field
      detectedFields.push({ label: word, value: '' });
      processedTexts.add(word.toLowerCase());
    }

    // Extract all numbers with context
    const numberRegex = /(\d+(?:\.\d+)?)/g;
    let numberMatch;
    const numbersAdded = new Set<string>();

    while ((numberMatch = numberRegex.exec(text)) !== null) {
      const num = numberMatch[1];

      // Skip if already added
      if (numbersAdded.has(num) || processedTexts.has(num)) continue;

      // Add number as field
      detectedFields.push({ label: '#', value: num });
      numbersAdded.add(num);
      processedTexts.add(num);
    }

    // Extract time patterns (HH:MM or MM:SS)
    const timeRegex = /(\d+:\d+)/g;
    let timeMatch;

    while ((timeMatch = timeRegex.exec(text)) !== null) {
      const time = timeMatch[1];
      if (!processedTexts.has(time)) {
        detectedFields.push({ label: '⏱️', value: time });
        processedTexts.add(time);
      }
    }

    // Extract percentages
    const percentRegex = /(\d+(?:\.\d+)?%)/g;
    let percentMatch;

    while ((percentMatch = percentRegex.exec(text)) !== null) {
      const percent = percentMatch[1];
      if (!processedTexts.has(percent)) {
        detectedFields.push({ label: '%', value: percent });
        processedTexts.add(percent);
      }
    }

    // Extract all lines of text (for comprehensive capture)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
      // Skip if already processed or too long
      if (processedTexts.has(line.toLowerCase()) || line.length > 60) continue;
      if (stopWords.has(line.toLowerCase())) continue;

      // Skip if it's just a number or already exists as key-value
      if (/^\d+$/.test(line) || detectedFields.some(f => f.value === line)) continue;

      // Check if it's a new field
      if (!line.includes(':') && !line.includes('=') && line.length > 2) {
        detectedFields.push({ label: 'Text', value: line });
        processedTexts.add(line.toLowerCase());
      }
    }

    // Set game name if provided
    if (!this.formData.game) {
      this.formData.game = this.sessionGame;
    }

    // Try to find the largest number for score field (optional)
    const allNumbers = text.match(/\b\d+\b/g);
    if (allNumbers && allNumbers.length > 0) {
      const largestNum = Math.max(...allNumbers.map(n => parseInt(n, 10)));
      if (largestNum > 0 && !isNaN(largestNum)) {
        this.formData.score = largestNum;
      }
    }

    // Update detected fields signal (limit to 20 fields for UI)
    this.detectedFields.set(detectedFields.slice(0, 20));
  }

  resetAndCapture(): void {
    this.showOcrResults.set(false);
    this.resetFormData();
    this.detectedFields.set([]);
    this.stopCamera();
  }

  private resetFormData(): void {
    this.formData = {
      game: this.sessionGame,
      score: 0,
      result: '',
    };
  }

  async onSave(): Promise<void> {
    // Prevent double submissions
    if (this.isSaving()) {
      console.warn('Already saving, ignoring duplicate submit');
      return;
    }

    if (!this.sessionId) {
      alert('Error: Session ID is required. Please try again.');
      return;
    }

    if (!this.formData.game) {
      alert('Error: Game name is required. Please enter the game name.');
      return;
    }

    if (this.formData.score < 0) {
      alert('Error: Score must be a valid number.');
      return;
    }

    this.isSaving.set(true);

    try {
      // Extract OCR results from detected fields
      const ocrResults = this.detectedFields()
        .map(f => `${f.label}: ${f.value}`)
        .join('\n');

      // Compress image before sending
      let compressedImage = '';
      if (this.capturedImageData) {
        compressedImage = await this.compressImage(this.capturedImageData, 0.6);
      }

      console.log('Saving result:', {
        sessionId: this.sessionId,
        game: this.formData.game,
        score: this.formData.score,
        result: this.formData.result,
        hasOCR: !!ocrResults,
        hasImage: !!compressedImage,
      });

      this.http
        .post<{ success: boolean; data: any; error?: string }>(
          `${this.apiUrl}/api/game-results`,
          {
            sessionId: this.sessionId,
            game: this.formData.game,
            score: this.formData.score,
            result: this.formData.result || undefined,
            ocrResults: ocrResults || undefined,
            captureImage: compressedImage || undefined,
          },
        )
        .subscribe({
          next: (response) => {
            console.log('Save response:', response);
            if (response.success) {
              console.log('Result saved successfully');
              this.isSaving.set(false);
              this.save.emit(this.formData as CaptureResult);
            } else {
              const errorMsg = response.error || 'Unknown error';
              console.error('Save failed:', errorMsg);
              alert(`Failed to save result: ${errorMsg}`);
              this.isSaving.set(false);
            }
          },
          error: (err) => {
            console.error('HTTP Error saving result:', err);
            const errorMsg = err.error?.error || err.message || 'Unknown error';
            alert(`Failed to save result to server: ${errorMsg}`);
            this.isSaving.set(false);
          },
        });
    } catch (error) {
      console.error('Error preparing save:', error);
      this.isSaving.set(false);
    }
  }

  onClose(): void {
    this.closeDialog.emit();
  }
}
