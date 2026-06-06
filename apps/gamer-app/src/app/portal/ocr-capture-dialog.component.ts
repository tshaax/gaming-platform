import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Tesseract from 'tesseract.js';

export interface CaptureResult {
  game: string;
  score: number;
  placement: number;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
}

type DialogMode = 'capture' | 'upload' | 'result';
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

        <div class="p-6">
          <!-- Mode Tabs -->
          <div class="flex gap-2 mb-6">
            <button
              (click)="setMode('camera')"
              [class.active]="mode() === 'camera'"
              class="px-4 py-2 rounded-lg font-semibold transition-colors"
              [ngClass]="mode() === 'camera'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
            >
              📷 Camera
            </button>
            <button
              (click)="setMode('upload')"
              [class.active]="mode() === 'upload'"
              class="px-4 py-2 rounded-lg font-semibold transition-colors"
              [ngClass]="mode() === 'upload'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
            >
              📤 Upload
            </button>
          </div>

          <!-- Camera Mode -->
          @if (mode() === 'camera') {
            <div class="space-y-4">
              @if (!cameraActive()) {
                <button
                  (click)="startCamera()"
                  [disabled]="isProcessing()"
                  class="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all"
                >
                  🎥 Start Camera
                </button>
              } @else {
                <div class="space-y-3">
                  <video
                    #videoElement
                    autoplay
                    playsinline
                    class="w-full rounded-lg bg-black">
                  </video>
                  <canvas #canvasElement style="display: none;"></canvas>
                  <div class="flex gap-2">
                    <button
                      (click)="captureFrame()"
                      [disabled]="isProcessing()"
                      class="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all"
                    >
                      ✓ Capture
                    </button>
                    <button
                      (click)="stopCamera()"
                      class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
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
            <div class="space-y-4">
              <label class="block">
                <div class="border-2 border-dashed border-cyan-400/50 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-400 transition-colors">
                  <div class="text-4xl mb-2">📁</div>
                  <p class="text-white font-semibold mb-1">Click to upload or drag and drop</p>
                  <p class="text-slate-400 text-sm">PNG, JPG, or GIF (max 5MB)</p>
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
        </div>

        <!-- Result Form -->
        <div class="px-6 pb-6 space-y-4">
          <!-- Game Name -->
          <div>
            <label for="game" class="block text-sm text-slate-300 mb-2">Game Name</label>
            <input
              id="game"
              [(ngModel)]="formData.game"
              type="text"
              placeholder="Game name"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <!-- Score -->
          <div>
            <label for="score" class="block text-sm text-slate-300 mb-2">Score</label>
            <input
              id="score"
              [(ngModel)]="formData.score"
              type="number"
              class="w-full px-4 py-2 bg-slate-700/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <!-- Placement -->
          <div>
            <label for="placement" class="block text-sm text-slate-300 mb-2">Placement</label>
            <input
              id="placement"
              [(ngModel)]="formData.placement"
              type="number"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
            />
          </div>

          <!-- Result -->
          <div>
            <label for="result" class="block text-sm text-slate-300 mb-2">Result</label>
            <select
              id="result"
              [(ngModel)]="formData.result"
              class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
            >
              <option value="">Select result...</option>
              <option value="win">Win 🏆</option>
              <option value="loss">Loss 😔</option>
              <option value="draw">Draw 🤝</option>
            </select>
          </div>

          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label for="kills" class="block text-sm text-slate-300 mb-2">Kills</label>
              <input
                id="kills"
                [(ngModel)]="formData.kills"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label for="deaths" class="block text-sm text-slate-300 mb-2">Deaths</label>
              <input
                id="deaths"
                [(ngModel)]="formData.deaths"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label for="assists" class="block text-sm text-slate-300 mb-2">Assists</label>
              <input
                id="assists"
                [(ngModel)]="formData.assists"
                type="number"
                class="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              (click)="onClose()"
              type="button"
              class="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              (click)="onSave()"
              [disabled]="!formData.game"
              type="button"
              class="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⭐</span>
              <span>Save Result</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class OcrCaptureDialogComponent implements OnDestroy {
  @Input() sessionGame = 'Game Name';
  @Output() save = new EventEmitter<CaptureResult>();
  @Output() closeDialog = new EventEmitter<void>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  mode = signal<CaptureMode>('upload');
  cameraActive = signal(false);
  isProcessing = signal(false);
  ocrProgress = signal(0);

  formData = {
    game: '',
    score: 0,
    placement: 1,
    result: '',
    kills: 0,
    deaths: 0,
    assists: 0,
  };

  private mediaStream: MediaStream | null = null;

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

    try {
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
        logger: (m) => {
          this.ocrProgress.set(Math.round(m.progress * 100));
        },
      });

      this.parseOcrText(text);
    } catch (err) {
      console.error('OCR error:', err);
      alert('Failed to process image. Please try again.');
    } finally {
      this.isProcessing.set(false);
      this.ocrProgress.set(0);
    }
  }

  private parseOcrText(text: string): void {
    const normalized = text.toLowerCase();

    // Score: look for "score: XXX" or large numbers
    const scoreMatch = normalized.match(/score[:\s]+(\d+)/i);
    if (scoreMatch) {
      this.formData.score = parseInt(scoreMatch[1], 10);
    }

    // Kills: look for "kills: XXX" or "k: XXX"
    const killsMatch = normalized.match(/(?:kills?|k)[:\s]+(\d+)/i);
    if (killsMatch) {
      this.formData.kills = parseInt(killsMatch[1], 10);
    }

    // Deaths: look for "deaths: XXX" or "d: XXX"
    const deathsMatch = normalized.match(/(?:deaths?|d)[:\s]+(\d+)/i);
    if (deathsMatch) {
      this.formData.deaths = parseInt(deathsMatch[1], 10);
    }

    // Assists: look for "assists: XXX" or "a: XXX"
    const assistsMatch = normalized.match(/(?:assists?|a)[:\s]+(\d+)/i);
    if (assistsMatch) {
      this.formData.assists = parseInt(assistsMatch[1], 10);
    }

    // Placement: look for "1st", "2nd", "3rd", "place: X", "#X"
    const placementMatch = normalized.match(
      /(?:#|place|rank|position|placement)[:\s]*(\d+)|(\d+)(?:st|nd|rd|th)/i
    );
    if (placementMatch) {
      const placementStr = placementMatch[1] || placementMatch[2];
      this.formData.placement = parseInt(placementStr, 10);
    }

    // Result: look for "win", "loss", "draw"
    if (normalized.includes('win') || normalized.includes('victory') || normalized.includes('winner')) {
      this.formData.result = 'win';
    } else if (normalized.includes('loss') || normalized.includes('defeat') || normalized.includes('lost')) {
      this.formData.result = 'loss';
    } else if (normalized.includes('draw') || normalized.includes('tie')) {
      this.formData.result = 'draw';
    }

    // Set game name if provided
    if (!this.formData.game) {
      this.formData.game = this.sessionGame;
    }
  }

  onSave(): void {
    this.save.emit(this.formData as CaptureResult);
  }

  onClose(): void {
    this.closeDialog.emit();
  }
}
