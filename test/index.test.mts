import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { installOpenApiValidator } from '../lib/index.mjs';

interface IWithStatus {
    status?: number;
}

function buildServer(install: boolean, env: string): Application {
    const app = express();

    if (install) {
        app.use(installOpenApiValidator(join(dirname(fileURLToPath(import.meta.url)), 'openapi.yaml'), env));
    }

    app.get('/test', (req, res): void => {
        res.json({
            s: req.query['s'],
            debug: true,
        });
    });

    app.get('/auth', (_req, res): unknown => res.status(204).end());

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) =>
        res.status((err as IWithStatus).status ?? 500).json(err),
    );

    return app;
}

describe('installOpenApiValidator', function () {
    describe('Without installOpenApiValidator', function () {
        it('should return 200 for bad request', function () {
            const server = buildServer(false, '');
            return request(server).get('/test').expect(200);
        });
    });

    describe('With installOpenApiValidator', function () {
        describe('in test mode', function () {
            it('will validate all requests', function () {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test')
                    .expect(400)
                    .expect(/\/query\/s/u);
            });

            it('will thoroughly validate requests', function () {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test?s=2012-13-31')
                    .expect(400)
                    .expect(/\/query\/s/u)
                    .expect(/must match format/u);
            });

            it('will validate responses', function () {
                const server = buildServer(true, 'test');
                return request(server)
                    .get('/test?s=2012-12-31')
                    .expect(500)
                    .expect(/\/response\/debug/u);
            });
        });

        describe('in production mode', function () {
            it('will validate all requests', function () {
                const server = buildServer(true, 'production');
                return request(server)
                    .get('/test')
                    .expect(400)
                    .expect(/\/query\/s/u);
            });

            it('will not thoroughly validate requests', function () {
                const server = buildServer(true, 'production');
                return request(server).get('/test?s=2012-13-31').expect(200);
            });

            it('will not validate responses', function () {
                const server = buildServer(true, 'production');
                return request(server).get('/test?s=2012-12-31').expect(200);
            });
        });
    });
});
