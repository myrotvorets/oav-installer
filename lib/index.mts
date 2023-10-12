import { middleware } from 'express-openapi-validator';
import { OpenApiSpecLoader } from 'express-openapi-validator/dist/framework/openapi.spec.loader.js';
import type { Express } from 'express';
import type { OpenApiValidatorOpts } from 'express-openapi-validator/dist/openapi.validator.js';
export type { OpenApiRequest, OpenApiRequestMetadata } from 'express-openapi-validator/dist/framework/types.js';

export async function installOpenApiValidator(
    specFile: string,
    app: Express,
    env: string,
    extraOptions: Omit<
        OpenApiValidatorOpts,
        'apiSpec' | 'validateSecurity' | 'validateResponses' | 'validateFormats' | 'ajvFormats' | '$refParser'
    > = {},
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
        fileUploader: false,
        ...extraOptions,
        apiSpec: spec.apiDoc,
        validateSecurity: false,
        validateResponses: env !== 'production',
        validateFormats: true,
        ajvFormats: { mode: env !== 'production' ? 'full' : 'fast' },
        $refParser: {
            mode: 'dereference',
        },
    });

    app.use(validator);
}
