import { describe, it } from 'node:test';
import type { RequestListener } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { installOpenApiValidator } from '../lib/index.mjs';

interface IWithStatus {
    status?: number;
}

function buildServer(install: boolean, env: string): RequestListener {
    const app = express();
    app.set('x-powered-by', false);

    if (install) {
        app.use(installOpenApiValidator(join(dirname(fileURLToPath(import.meta.url)), 'openapi.yaml'), env));
    }

    app.get('/test', (req, res): void => {
        res.json({
            s: req.query['s'],
            debug: true,
        });
    });

    app.get('/auth', (_req, res): void => {
        res.status(204).end();
    });

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
        res.status((err as IWithStatus).status ?? 500).json(err);
    });

    return app as RequestListener;
}

const keepTSHappy = (): Promise<void> => Promise.resolve();

await describe('installOpenApiValidator', async () => {
    await describe('Without installOpenApiValidator', async () => {
        await it('should return 200 for bad request', () => {
            const server = buildServer(false, '');
            return request(server).get('/test').expect(200).then(keepTSHappy);
        });
    });

    await describe('With installOpenApiValidator', async () => {
        await describe('in test mode', async () => {
            await it('will validate all requests', () => {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test')
                    .expect(400)
                    .expect(/\/query\/s/u)
                    .then(keepTSHappy);
            });

            await it('will thoroughly validate requests', () => {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test?s=2012-13-31')
                    .expect(400)
                    .expect(/\/query\/s/u)
                    .expect(/must match format/u)
                    .then(keepTSHappy);
            });

            await it('will validate responses', () => {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test?s=2012-12-31')
                    .expect(500)
                    .expect(/\/response\/debug/u)
                    .then(keepTSHappy);
            });
        });

        await describe('in production mode', async () => {
            await it('will validate all requests', () => {
                const server = buildServer(true, 'production');
                return request(server)
                    .get('/test')
                    .expect(400)
                    .expect(/\/query\/s/u)
                    .then(keepTSHappy);
            });

            await it('will not thoroughly validate requests', () => {
                const server = buildServer(true, 'production');
                return request(server).get('/test?s=2012-13-31').expect(200).then(keepTSHappy);
            });

            await it('will not validate responses', () => {
                const server = buildServer(true, 'production');
                return request(server).get('/test?s=2012-12-31').expect(200).then(keepTSHappy);
            });
        });
    });
});
