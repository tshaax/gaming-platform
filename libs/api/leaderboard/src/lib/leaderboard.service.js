"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("@org/api/db");
var LeaderboardService = /** @class */ (function () {
    function LeaderboardService(pool) {
        this.pool = pool;
        this.db = (0, node_postgres_1.drizzle)(pool);
    }
    LeaderboardService.prototype.getLeaderboardData = function (storeId, game) {
        return __awaiter(this, void 0, void 0, function () {
            var query, results, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = this.db
                            .select({
                            id: db_1.eventResults.id,
                            playerUsername: db_1.eventResults.playerUsername,
                            game: db_1.events.game,
                            score: db_1.eventResults.score,
                            pointsEarned: db_1.eventResults.pointsEarned,
                            kills: db_1.eventResults.kills,
                            deaths: db_1.eventResults.deaths,
                            assists: db_1.eventResults.assists,
                            result: db_1.eventResults.result,
                            placement: db_1.eventResults.placement,
                            createdAt: db_1.eventResults.createdAt,
                        })
                            .from(db_1.eventResults)
                            .innerJoin(db_1.events, (0, drizzle_orm_1.eq)(db_1.eventResults.eventId, db_1.events.id));
                        // Filter by store
                        if (storeId && storeId !== 'all') {
                            query = query.where((0, drizzle_orm_1.eq)(db_1.events.storeId, storeId));
                        }
                        else if (storeId === null || storeId === 'all') {
                            // All stores - no filter or include all including null storeId
                            // No additional where clause needed
                        }
                        // Filter by game if provided
                        if (game && game !== 'all') {
                            query = query.where((0, drizzle_orm_1.eq)(db_1.events.game, game));
                        }
                        return [4 /*yield*/, query];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Database error in getLeaderboardData:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LeaderboardService.prototype.getTopPlayers = function (storeId, game) {
        return __awaiter(this, void 0, void 0, function () {
            var results, playerPoints_1, sortedPlayers, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getLeaderboardData(storeId, game)];
                    case 1:
                        results = _a.sent();
                        playerPoints_1 = {};
                        results.forEach(function (result) {
                            var points = result.pointsEarned || 0;
                            playerPoints_1[result.playerUsername] =
                                (playerPoints_1[result.playerUsername] || 0) + points;
                        });
                        sortedPlayers = Object.entries(playerPoints_1)
                            .sort(function (a, b) { return b[1] - a[1]; })
                            .map(function (_a, index) {
                            var playerUsername = _a[0], totalPoints = _a[1];
                            var rank = index + 1;
                            var rankTier = _this.getRankTier(rank);
                            return { playerUsername: playerUsername, totalPoints: totalPoints, rank: rank, rankTier: rankTier };
                        });
                        return [2 /*return*/, sortedPlayers.slice(0, 10)];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Database error in getTopPlayers:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LeaderboardService.prototype.getUniqueGames = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .selectDistinct({ game: db_1.events.game })
                                .from(db_1.events)
                                .where((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " IS NOT NULL"], ["", " IS NOT NULL"])), db_1.events.game))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results
                                .map(function (r) { return r.game; })
                                .filter(function (game) { return game !== null && game !== undefined; })];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Database error in getUniqueGames:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LeaderboardService.prototype.deleteResult = function (resultId) {
        return __awaiter(this, void 0, void 0, function () {
            var deleted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db
                                .delete(db_1.eventResults)
                                .where((0, drizzle_orm_1.eq)(db_1.eventResults.id, resultId))
                                .returning()];
                    case 1:
                        deleted = (_a.sent())[0];
                        if (!deleted) {
                            throw new Error('Result not found');
                        }
                        return [2 /*return*/, { success: true }];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Database error in deleteResult:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LeaderboardService.prototype.getRankTier = function (rank) {
        if (rank <= 10)
            return 'Legend';
        if (rank <= 50)
            return 'Master';
        if (rank <= 100)
            return 'Diamond';
        if (rank <= 500)
            return 'Platinum';
        return 'Gold';
    };
    return LeaderboardService;
}());
exports.LeaderboardService = LeaderboardService;
var templateObject_1;
