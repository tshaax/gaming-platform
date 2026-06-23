import { Router } from 'express';
import { z } from 'zod';
import { PlayerService } from './player.service';

const createPlayerSchema = z.object({
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  email: z.string().email().optional(),
  cellphone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  storeIds: z.array(z.string().uuid()),
});

const updatePlayerSchema = z.object({
  firstName: z.string().min(2).max(255).optional(),
  lastName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  cellphone: z.string().min(7).max(20).optional(),
});

const linkPlayerToStoresSchema = z.object({
  storeIds: z.array(z.string().uuid()),
});

export function createPlayerRouter(service: PlayerService): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const input = createPlayerSchema.parse(req.body);

      if (!input.email && !input.cellphone) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'At least one of email or cellphone is required',
        });
      }

      const player = await service.createPlayer(input);
      res.status(201).json({
        success: true,
        data: player,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create player';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const players = await service.getAllPlayers();
      res.json({
        success: true,
        data: players,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch players';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.get('/store/:storeId', async (req, res) => {
    try {
      const { storeId } = req.params;
      const players = await service.getPlayersByStore(storeId);
      res.json({
        success: true,
        data: players,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch players';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.get('/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      const player = await service.getPlayer(playerId);
      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Player not found';
      res.status(404).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.post('/:playerId/stores', async (req, res) => {
    try {
      const { playerId } = req.params;
      const input = linkPlayerToStoresSchema.parse(req.body);

      const player = await service.linkPlayerToStores(playerId, input.storeIds);
      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to link player to stores';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.delete('/:playerId/stores/:storeId', async (req, res) => {
    try {
      const { playerId, storeId } = req.params;
      await service.unlinkPlayerFromStore(playerId, storeId);
      res.json({
        success: true,
        data: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to unlink player from store';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.put('/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      const input = updatePlayerSchema.parse(req.body);

      const player = await service.updatePlayer(playerId, input);
      res.json({
        success: true,
        data: player,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update player';
      res.status(400).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  router.delete('/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      await service.deletePlayer(playerId);
      res.json({
        success: true,
        data: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete player';
      res.status(500).json({
        success: false,
        data: null,
        error: message,
      });
    }
  });

  return router;
}
