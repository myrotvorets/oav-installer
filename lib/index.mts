import { middleware } from 'express-openapi-validator';
import type { OpenApiValidatorOpts } from 'express-openapi-validator/dist/openapi.validator.js';
export type { OpenApiRequest, OpenApiRequestMetadata } from 'express-openapi-validator/dist/framework/types.js';

export function installOpenApiValidator(
    specFile: string,
    env: string,
    extraOptions: Omit<
        OpenApiValidatorOpts,
        'apiSpec' | 'validateResponses' | 'validateFormats' | 'ajvFormats' | '$refParser'
    > = {},
): ReturnType<typeof middleware> {
    return middleware({
        fileUploader: false,
        ...extraOptions,
        apiSpec: specFile,
        validateResponses: env !== 'production',
        validateFormats: true,
        ajvFormats: { mode: env !== 'production' ? 'full' : 'fast' },
        $refParser: {
            mode: 'dereference',
        },
    });
}
