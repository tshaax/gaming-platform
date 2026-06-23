import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@org/fe/auth';
import { environment } from '../../environments/environment';
import { OcrCaptureDialogComponent, CaptureResult } from './ocr-capture-dialog.component';

interface ActiveSession {
  id: string;
  storeId: string;
  storeName: string;
  stationName: string;
  game?: string;
  startedAt: Date;
  durationMins: number;
  ratePerHour: string;
  eventId?: string;
  timeLeft?: string;
}

interface Player {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  cellphone?: string;
}

interface SelectedOpponent {
  id: string;
  name: string;
}

interface Game {
  id: string;
  storeId: string;
  name: string;
  thumbnail?: string;
  isActive: boolean;
}

interface EventRegistration {
  id: string;
  eventId: string;
  gamerId: string;
  totalEligibleSessions: number;
  usedSessions: number;
  status: string;
  currentRound?: string;
  isEliminated?: boolean;
  updatedAt?: string;
  eventTitle?: string;
  entryFeeType?: string;
  eventGame?: string;
}

@Component({
  selector: 'app-gaming-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OcrCaptureDialogComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <!-- Header -->
      <header class="bg-black/40 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              (click)="goBack()"
              class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 class="text-2xl font-bold text-white">{{ session()?.storeName }}</h1>
              <p class="text-purple-200 text-sm">Station: {{ session()?.stationName }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="viewPlayHistory()"
              class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              📊 Play History
            </button>
            <button
              (click)="endSession()"
              class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              ⏹️ End Session
            </button>
            <button
              (click)="logout()"
              class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Event or Normal Session Dialog -->
      @if (showEventOrNormalSessionDialog()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 w-full max-w-md">
            <div class="p-6 border-b border-white/10">
              <h2 class="text-2xl font-bold text-white">🎮 How to Play?</h2>
              <p class="text-slate-400 text-sm mt-2">You have reserved event sessions. What would you like to do?</p>
            </div>

            <div class="p-6 space-y-4">
              <!-- Play Event Option -->
              @for (event of playerReservedEvents(); track event.id) {
                <button
                  (click)="chooseEventSession(event)"
                  type="button"
                  class="w-full p-4 bg-gradient-to-r from-purple-600/30 to-purple-700/30 hover:from-purple-600/50 hover:to-purple-700/50 border border-purple-400/50 rounded-lg transition-all text-left"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-white font-bold">🏆 {{ event.eventTitle }}</p>
                      <p class="text-purple-300 text-sm">Sessions: <span class="text-green-400 font-bold">{{ (event.totalEligibleSessions - event.usedSessions) }}</span> / {{ event.totalEligibleSessions }}</p>
                    </div>
                    <span class="text-2xl">→</span>
                  </div>
                </button>
              }

              <!-- Play Normal Session Option -->
              <button
                (click)="chooseNormalSession()"
                type="button"
                class="w-full p-4 bg-gradient-to-r from-cyan-600/30 to-cyan-700/30 hover:from-cyan-600/50 hover:to-cyan-700/50 border border-cyan-400/50 rounded-lg transition-all"
              >
                <div class="flex items-center justify-between">
                  <div class="text-left">
                    <p class="text-white font-bold">🎮 Normal Session</p>
                    <p class="text-cyan-300 text-sm">Play without using reserved events</p>
                  </div>
                  <span class="text-2xl">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      }

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Active Session Card -->
        @if (session()) {
          <div class="bg-gradient-to-br from-cyan-600/20 to-blue-700/20 backdrop-blur-md rounded-2xl p-8 border border-cyan-400/30 mb-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p class="text-cyan-200 text-sm mb-1">Started</p>
                <p class="text-white text-lg font-semibold">{{ session()?.startedAt | date: 'yyyy/MM/dd HH:mm' }}</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Time Left</p>
                <p [ngClass]="session()?.timeLeft === '0 min' ? 'text-red-400' : 'text-white'" class="text-lg font-semibold">{{ session()?.timeLeft || '0 min' }}</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Rate</p>
                <p class="text-white text-lg font-semibold">{{ session()?.ratePerHour || '0' }}</p>
              </div>
              <div>
                <p class="text-cyan-200 text-sm mb-1">Game</p>
                <p class="text-white text-lg font-semibold">{{ session()?.game || 'Not set' }}</p>
              </div>
            </div>
          </div>
        }

        <!-- Game Details Form -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-8 mb-8">
          <h2 class="text-2xl font-bold text-white mb-6">Game Details</h2>

          <form [formGroup]="gameForm" class="space-y-6">
            <!-- Game Selection with Filter and Pagination -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-3">
                Select a Game
              </label>

              <!-- Game Filter Dropdown -->
              @if (games().length > 0) {
                <div class="mb-4">
                  <select
                    [value]="selectedGameFilter()"
                    (change)="onFilterChange($any($event).target.value)"
                    class="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400 appearance-none"
                  >
                    <option value="">All Games</option>
                    @for (game of games(); track game.id) {
                      <option [value]="game.name">{{ game.name }}</option>
                    }
                  </select>
                </div>
              }

              @if (games().length === 0) {
                <div class="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-slate-400 text-center">
                  No games available for this store
                </div>
              } @else {
                @if (filteredAndPaginatedGames().length === 0) {
                  <div class="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-slate-400 text-center">
                    No games match your filter
                  </div>
                } @else {
                <!-- Game Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  @for (game of filteredAndPaginatedGames(); track game.id) {
                    @if (game.isActive) {
                      <button
                        type="button"
                        (click)="selectGame(game.id)"
                        [class.ring-2]="gameForm.get('gameId')?.value === game.id"
                        [class.ring-cyan-400]="gameForm.get('gameId')?.value === game.id"
                        [class.border-cyan-400/70]="gameForm.get('gameId')?.value === game.id"
                        [class.border-white/20]="gameForm.get('gameId')?.value !== game.id"
                        class="relative overflow-hidden rounded-lg border transition-all duration-200 hover:border-cyan-400/50 group"
                      >
                        <!-- Thumbnail -->
                        @if (game.thumbnail) {
                          <img
                            [src]="game.thumbnail"
                            [alt]="game.name"
                            class="w-full h-32 object-cover"
                          />
                        } @else {
                          <div class="w-full h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                            <span class="text-slate-500">No image</span>
                          </div>
                        }

                        <!-- Game Name Overlay -->
                        <div class="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors flex items-end p-2">
                          <p class="text-white text-xs font-semibold line-clamp-2">
                            {{ game.name }}
                          </p>
                        </div>

                        <!-- Selection Indicator -->
                        @if (gameForm.get('gameId')?.value === game.id) {
                          <div class="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm font-bold">✓</span>
                          </div>
                        }
                      </button>
                    }
                  }
                </div>

                <!-- Pagination Controls -->
                @if (totalPages() > 1) {
                  <div class="flex items-center justify-between mt-4 px-4 py-3 bg-slate-700/30 rounded-lg border border-white/10">
                    <button
                      (click)="prevPage()"
                      [disabled]="currentPage() === 1"
                      class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded transition-colors"
                    >
                      ← Previous
                    </button>
                    <span class="text-slate-300 text-sm">
                      Page {{ currentPage() }} of {{ totalPages() }}
                    </span>
                    <button
                      (click)="nextPage()"
                      [disabled]="currentPage() === totalPages()"
                      class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                }
                }
              }
              <!-- Hidden select for form tracking -->
              <select
                formControlName="gameId"
                class="hidden"
              >
              </select>
              <p class="text-slate-400 text-xs mt-3">Click a game thumbnail to select it</p>
            </div>

            <!-- CPU vs Opponent -->
            <div>
              <p class="block text-sm font-medium text-slate-300 mb-3">Playing Against</p>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    formControlName="opponentType"
                    value="cpu"
                    class="w-4 h-4"
                  />
                  <span class="text-white">CPU / Practice</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    formControlName="opponentType"
                    value="opponent"
                    class="w-4 h-4"
                  />
                  <span class="text-white">Other Player</span>
                </label>
              </div>
            </div>

            <!-- Opponent Selection -->
            @if (gameForm.get('opponentType')?.value === 'opponent') {
              <div class="relative">
                <label for="opponent" class="block text-sm font-medium text-slate-300 mb-2">
                  Select Opponent
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="opponent"
                    [value]="selectedOpponentName() || opponentSearch()"
                    (input)="onOpponentSearch($any($event).target.value)"
                    (focus)="showOpponentDropdown.set(true)"
                    [placeholder]="selectedOpponentName() ? 'Change opponent...' : 'Search by name, email or phone...'"
                    class="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 placeholder-slate-500"
                  />
                  @if (opponentSearch()) {
                    <button
                      type="button"
                      (click)="clearOpponentSearch()"
                      class="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  }
                </div>

                <!-- Opponent Dropdown -->
                @if (showOpponentDropdown() && filteredOpponents().length > 0) {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-white/10 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    @for (player of filteredOpponents(); track player.id) {
                      <button
                        type="button"
                        (click)="selectOpponent(player.id)"
                        [class.bg-cyan-600/30]="gameForm.get('opponentUserId')?.value === player.id"
                        class="w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <div class="text-white font-medium">
                          {{ (player.firstName && player.lastName) ? player.firstName + ' ' + player.lastName : (player.firstName || player.lastName || player.email || player.cellphone || 'Unknown') }}
                        </div>
                        <div class="text-xs text-slate-400 mt-1">
                          @if (player.email) {
                            {{ maskEmail(player.email) }} (Email)
                          } @else if (player.cellphone) {
                            {{ maskPhoneNumber(player.cellphone) }} (Phone)
                          }
                        </div>
                      </button>
                    }
                  </div>
                }

                @if (showOpponentDropdown() && filteredOpponents().length === 0 && otherPlayers().length > 0) {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-white/10 rounded-lg px-4 py-3 text-slate-400 text-sm z-10">
                    No players match your search
                  </div>
                }

                @if (otherPlayers().length === 0) {
                  <div class="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-white/10 rounded-lg px-4 py-3 text-slate-400 text-sm z-10">
                    No other players available at this store
                  </div>
                }

                <!-- Hidden select for form tracking -->
                <select
                  formControlName="opponentUserId"
                  class="hidden"
                >
                </select>
              </div>
            }

            <!-- Combined Save & Capture Button -->
            <button
              type="button"
              (click)="saveDetailsAndCapture()"
              [disabled]="isSavingDetails() || !gameForm.get('gameId')?.value"
              class="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold text-lg rounded-lg transition-all flex items-center justify-center gap-2"
            >
              @if (isSavingDetails()) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving & Preparing...</span>
              } @else {
                <span>🎮</span>
                <span>Save Game & Capture Results</span>
              }
            </button>
          </form>
        </div>
      </main>

      <!-- OCR Capture Dialog -->
      @if (showOcrDialog()) {
        <app-ocr-capture-dialog
          [sessionGame]="session()?.game || 'Unknown Game'"
          [sessionId]="session()?.id || ''"
          (save)="submitResults($event)"
          (closeDialog)="closeOcrDialog()"
        />
      }
    </div>
  `,
  styles: [],
})
export class GamingPortalComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  session = signal<ActiveSession | null>(null);
  otherPlayers = signal<Player[]>([]);
  games = signal<Game[]>([]);
  isSavingDetails = signal(false);
  showOcrDialog = signal(false);
  isSubmitting = signal(false);
  showEventOrNormalSessionDialog = signal(false);
  playerReservedEvents = signal<EventRegistration[]>([]);
  selectedEventForSession = signal<EventRegistration | null>(null);
  selectedEventGame = signal<string | null>(null);

  // Filter and Pagination
  selectedGameFilter = signal<string>('');
  currentPage = signal(1);
  pageSize = signal(6); // Show 6 games per page (2x3 grid)

  // Opponent Search
  opponentSearch = signal<string>('');
  showOpponentDropdown = signal(false);
  selectedOpponentName = signal<string>('');

  filteredOpponents = computed(() => {
    const search = this.opponentSearch().toLowerCase();
    return search
      ? this.otherPlayers().filter(p =>
          (p.email?.toLowerCase().includes(search) ||
           p.cellphone?.toLowerCase().includes(search))
        )
      : this.otherPlayers();
  });

  filteredAndPaginatedGames = computed(() => {
    const filter = this.selectedGameFilter().toLowerCase();
    const allGames = this.games();

    // Filter games
    const filtered = filter
      ? allGames.filter(g => g.name.toLowerCase().includes(filter))
      : allGames;

    // Paginate
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    const end = start + size;

    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const filter = this.selectedGameFilter().toLowerCase();
    const allGames = this.games();
    const filtered = filter
      ? allGames.filter(g => g.name.toLowerCase().includes(filter))
      : allGames;

    return Math.ceil(filtered.length / this.pageSize());
  });

  gameForm: FormGroup;
  private timerInterval: any;

  constructor() {
    this.gameForm = this.fb.group({
      gameId: ['', Validators.required],
      opponentType: ['cpu'],
      opponentUserId: [''],
    });
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    let sessionData = (navigation?.extras.state as any)?.session;

    if (!sessionData && (window.history.state as any)?.session) {
      sessionData = (window.history.state as any).session;
    }

    if (sessionData) {
      this.session.set({ ...sessionData, startedAt: new Date(sessionData.startedAt) });
      this.updateTimeLeft();
      this.startTimer();
      this.loadOtherPlayers(sessionData.storeId);
      this.loadGames(sessionData.storeId);

      // Load player's reserved events and show dialog if they have any
      this.loadPlayerReservedEvents();
    } else {
      this.router.navigate(['/']);
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => this.updateTimeLeft(), 1000);
  }

  private updateTimeLeft(): void {
    const sess = this.session();
    if (!sess) return;

    const startedAt = new Date(sess.startedAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 60000);
    const remainingMinutes = Math.max(0, sess.durationMins - elapsedMinutes);
    const timeLeftStr = `${remainingMinutes} min`;

    this.session.set({ ...sess, timeLeft: timeLeftStr });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadOtherPlayers(storeId: string): void {
    this.http.get<{ data: Player[]; success: boolean }>(
      `${this.apiUrl}/api/players/store/${storeId}`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.otherPlayers.set(response.data);
        }
      },
      error: (err) => {
        console.error('Failed to load players:', err);
      },
    });
  }

  private loadGames(storeId: string): void {
    this.http.get<{ data: Game[]; success: boolean }>(
      `${this.apiUrl}/api/gaming-sessions/games/${storeId}`
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.games.set(response.data.filter(g => g.isActive));
          // Auto-select event game if one was previously selected
          this.autoSelectEventGame();
        }
      },
      error: (err) => {
        console.error('Failed to load games:', err);
      },
    });
  }

  selectGame(gameId: string): void {
    this.gameForm.patchValue({ gameId });
  }

  onFilterChange(gameName: string): void {
    this.selectedGameFilter.set(gameName);
    this.currentPage.set(1); // Reset to first page when filter changes
  }

  onOpponentSearch(value: string): void {
    this.opponentSearch.set(value);
    if (value) {
      this.showOpponentDropdown.set(true);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  maskEmail(email: string | undefined): string {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return this.maskString(email, 2);

    const visibleChars = Math.min(2, username.length);
    const maskedUsername = username.substring(0, visibleChars) + '*'.repeat(Math.max(1, username.length - visibleChars));
    const [domainName, tld] = domain.split('.');
    const maskedDomain = '*'.repeat(Math.max(1, domainName.length - 1)) + domainName.charAt(domainName.length - 1);
    return `${maskedUsername}@${maskedDomain}.${tld}`;
  }

  maskPhoneNumber(phone: string | undefined): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return phone;
    const lastFour = digits.slice(-4);
    const masked = '*'.repeat(Math.max(1, digits.length - 4));
    return `${masked}${lastFour}`;
  }

  private maskString(value: string, visibleChars: number): string {
    if (value.length <= visibleChars) return value;
    const visible = value.substring(0, visibleChars);
    const masked = '*'.repeat(Math.max(1, value.length - visibleChars));
    return `${visible}${masked}`;
  }

  selectOpponent(playerId: string): void {
    const selectedPlayer = this.otherPlayers().find(p => p.id === playerId);
    const opponentName = selectedPlayer
      ? `${selectedPlayer.firstName || ''} ${selectedPlayer.lastName || ''}`.trim() || selectedPlayer.email || selectedPlayer.cellphone || 'Unknown'
      : 'Unknown';

    this.gameForm.patchValue({ opponentUserId: playerId });
    this.selectedOpponentName.set(opponentName);
    this.opponentSearch.set('');
    this.showOpponentDropdown.set(false);
  }

  toggleOpponentDropdown(): void {
    this.showOpponentDropdown.update(v => !v);
  }

  clearOpponentSearch(): void {
    this.opponentSearch.set('');
    if (!this.selectedOpponentName()) {
      this.gameForm.patchValue({ opponentUserId: '' });
      this.selectedOpponentName.set('');
    }
  }

  saveDetailsAndCapture(): void {
    if (!this.session() || !this.gameForm.valid) return;

    this.isSavingDetails.set(true);
    const selectedGameId = this.gameForm.get('gameId')?.value;
    const selectedGame = this.games().find(g => g.id === selectedGameId);

    const payload = {
      game: selectedGame?.name || '',
      opponentUserId: this.gameForm.get('opponentUserId')?.value || null,
    };

    this.http.put(
      `${this.apiUrl}/api/gaming-sessions/${this.session()!.id}/details`,
      payload
    ).subscribe({
      next: () => {
        this.isSavingDetails.set(false);
        const updatedSession = { ...this.session()!, game: payload.game };
        this.session.set(updatedSession);
        this.showOcrDialog.set(true);
      },
      error: (err) => {
        console.error('Failed to save details:', err);
        this.isSavingDetails.set(false);
      },
    });
  }

  closeOcrDialog(): void {
    this.showOcrDialog.set(false);
  }

  submitResults(result: CaptureResult): void {
    if (!this.session()) return;

    this.isSubmitting.set(true);
    const payload = {
      game: result.game,
      score: result.score,
      result: result.result,
    };

    this.http.post(
      `${this.apiUrl}/api/gaming-sessions/${this.session()!.id}/results`,
      payload
    ).subscribe({
      next: () => {
        // If this was an event session, mark the session as used
        const eventRegistration = this.selectedEventForSession();
        if (eventRegistration) {
          this.markEventSessionAsUsed(eventRegistration.id);
        } else {
          this.continueSession();
        }
      },
      error: (err) => {
        console.error('Failed to submit results:', err);
        this.isSubmitting.set(false);
      },
    });
  }

  private markEventSessionAsUsed(registrationId: string): void {
    this.http.post(
      `${this.apiUrl}/api/events/registrations/${registrationId}/use-session`,
      {}
    ).subscribe({
      next: () => {
        this.continueSession();
      },
      error: (err) => {
        console.error('Failed to mark event session as used:', err);
        // Still continue the session even if marking as used fails
        this.continueSession();
      },
    });
  }

  private continueSession(): void {
    this.isSubmitting.set(false);
    this.showOcrDialog.set(false);
    this.gameForm.reset({ opponentType: 'cpu' });
    // Keep the player in the session to allow playing more games
  }

  private loadPlayerReservedEvents(): void {
    const sessionEventId = this.session()?.eventId;

    // Only show event dialog if the session was created with an event
    if (!sessionEventId) {
      return;
    }

    const playerId = this.authService.userId();

    if (!playerId) {
      console.warn('Player ID not available');
      return;
    }

    const url = `${this.apiUrl}/api/events/player/${playerId}/registrations`;
    console.log('Loading player reserved events:', url);

    this.http.get<{ data: EventRegistration[] }>(url).subscribe({
      next: (response) => {
        console.log('Player event registrations loaded:', response.data);
        // Filter for active registrations with remaining sessions
        const active = (response.data || []).filter(
          reg => reg.status === 'active' && (reg.totalEligibleSessions - reg.usedSessions) > 0
        );
        this.playerReservedEvents.set(active);

        // Show event selection dialog if player has reserved events and session is linked to an event
        if (active.length > 0) {
          this.showEventOrNormalSessionDialog.set(true);
        }
      },
      error: (err) => {
        console.log('No reserved events found:', err.status);
        this.playerReservedEvents.set([]);
      },
    });
  }

  chooseEventSession(event: EventRegistration): void {
    // Player chose to play an event session
    this.selectedEventForSession.set(event);
    this.selectedEventGame.set(event.eventGame || null);
    this.showEventOrNormalSessionDialog.set(false);
    console.log('Player chose to play event session:', event.eventTitle, 'Game:', event.eventGame);

    // Auto-select the game if it's available
    this.autoSelectEventGame();
  }

  private autoSelectEventGame(): void {
    const eventGame = this.selectedEventGame();
    if (!eventGame) return;

    const matchingGame = this.games().find(g => g.name === eventGame);
    if (matchingGame) {
      this.gameForm.patchValue({ gameId: matchingGame.id });
      console.log('Auto-selected game:', matchingGame.name);
    }
  }

  chooseNormalSession(): void {
    // Player chose to play a normal session
    this.selectedEventForSession.set(null);
    this.selectedEventGame.set(null);
    this.playerReservedEvents.set([]);
    this.showEventOrNormalSessionDialog.set(false);
    this.gameForm.patchValue({ gameId: '' });
    console.log('Player chose to play a normal session');
  }

  endSession(): void {
    if (!this.session()) return;

    this.isSavingDetails.set(true);
    this.http.put(
      `${this.apiUrl}/api/gaming-sessions/${this.session()!.id}/end`,
      {}
    ).subscribe({
      next: () => {
        this.isSavingDetails.set(false);
        this.router.navigate(['/history']);
      },
      error: (err) => {
        console.error('Failed to end session:', err);
        this.isSavingDetails.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  viewPlayHistory(): void {
    this.router.navigate(['/history']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        console.error('Logout failed');
      },
    });
  }
}
