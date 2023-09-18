import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'mocha';
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { installOpenApiValidator } from '../lib/index.mjs';

interface IWithStatus {
    status?: number;
}

async function buildServer(install: boolean, env: string): Promise<Application> {
    const app = express();

    if (install) {
        await installOpenApiValidator(join(dirname(fileURLToPath(import.meta.url)), 'openapi.yaml'), app, env);
    }

    app.get('/test', (req: Request, res: Response): void => {
        res.json({
            s: req.query.s,
            debug: true,
        });
    });

    app.get('/auth', (_req: Request, res: Response): unknown => res.status(204).end());

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) =>
        res.status((err as IWithStatus).status ?? 500).json(err),
    );

    return app;
}

describe('Without installOpenApiValidator', () => {
    it('should return 200 for bad request', async (): Promise<unknown> => {
        const server = await buildServer(false, '');
        return request(server).get('/test').expect(200);
    });
});

describe('With installOpenApiValidator', () => {
    it('will not run security handlers', async (): Promise<unknown> => {
        const server = await buildServer(true, 'test');
        return request(server).get('/auth').expect(204);
    });

    describe('in test mode', () => {
        // This one checks that `servers` section gets overwritten
        // If `servers` is not overwritten, the URL won't match the base URL constraint
        it('will validate all requests', async (): Promise<unknown> => {
            const server = await buildServer(true, 'test');
            return request(server)
                .get('/test')
                .expect(400)
                .expect(/\/query\/s/u);
        });

        it('will thoroughly validate requests', async (): Promise<unknown> => {
            const server = await buildServer(true, 'test');
            return request(server)
                .get('/test?s=2012-13-31')
                .expect(400)
                .expect(/\/query\/s/u)
                .expect(/must match format/u);
        });

        it('will validate responses', async (): Promise<unknown> => {
            const server = await buildServer(true, 'test');
            return request(server)
                .get('/test?s=2012-12-31')
                .expect(500)
                .expect(/\/response\/debug/u);
        });
    });

    describe('in production mode', () => {
        it('will validate all requests', async (): Promise<unknown> => {
            const server = await buildServer(true, 'production');
            return request(server)
                .get('/test')
                .expect(400)
                .expect(/\/query\/s/u);
        });

        it('will not thoroughly validate requests', async (): Promise<unknown> => {
            const server = await buildServer(true, 'production');
            return request(server).get('/test?s=2012-13-31').expect(200);
        });

        it('will not validate responses', async (): Promise<unknown> => {
            const server = await buildServer(true, 'production');
            return request(server).get('/test?s=2012-12-31').expect(200);
        });
    });
});
