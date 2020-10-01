import type { Express } from 'express';
import { middleware } from 'express-openapi-validator';
import { OpenApiSpecLoader } from 'express-openapi-validator/dist/framework/openapi.spec.loader';

export async function installOpenApiValidator(specFile: string, app: Express, env: string): Promise<void> {
    const loader = new OpenApiSpecLoader({
        apiDoc: specFile,
        $refParser: {
            mode: 'dereference',
        },
    });

    const spec = await loader.load();
    spec.apiDoc.servers = [{ url: '/' }];

    const validator = middleware({
        apiSpec: spec.apiDoc,
        validateSecurity: false,
        validateResponses: env !== 'production',
        validateFormats: env !== 'production' ? 'full' : 'fast',
        $refParser: {
            mode: 'dereference',
        },
    });

    app.use(validator);
}
