import { middleware } from 'express-openapi-validator';
import { OpenApiSpecLoader } from 'express-openapi-validator/dist/framework/openapi.spec.loader';
import type { Express } from 'express';
import type { OpenApiValidatorOpts } from 'express-openapi-validator/dist/framework/types';

export async function installOpenApiValidator(
    specFile: string,
    app: Express,
    env: string,
    extraOptions: Partial<OpenApiValidatorOpts> = {},
): Promise<void> {
    const loader = new OpenApiSpecLoader({
        apiDoc: specFile,
        $refParser: {
            mode: 'dereference',
        },
    });

    const spec = await loader.load();
    spec.apiDoc.servers = [{ url: '/' }];

    const validator = middleware({
        ...extraOptions,
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
