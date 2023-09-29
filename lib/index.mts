import { middleware } from 'express-openapi-validator';
import { OpenApiSpecLoader, type Spec } from 'express-openapi-validator/dist/framework/openapi.spec.loader.js';
import type { Express } from 'express';
import type { OpenApiValidatorOpts } from 'express-openapi-validator/dist/openapi.validator.js';
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.d.ts';

function loadSpec(doc: OpenAPIV3.Document | string, validate: boolean): Promise<Spec> {
    const loader = new OpenApiSpecLoader({
        apiDoc: doc,
        validateApiSpec: validate,
        $refParser: {
            mode: 'dereference',
        },
    });

    return loader.load();
}

export async function installOpenApiValidator(
    specFile: string,
    app: Express,
    env: string,
    extraOptions: Omit<
        OpenApiValidatorOpts,
        'apiSpec' | 'validateSecurity' | 'validateResponses' | 'validateFormats' | 'ajvFormats' | '$refParser'
    > = {},
): Promise<void> {
    let spec = await loadSpec(specFile, extraOptions.validateApiSpec ?? false);
    if (spec.apiDoc.openapi.startsWith('3.1.') && extraOptions.validateApiSpec !== false) {
        // express-openapi-validator does not support OpenAPI 3.1 yet - see https://github.com/cdimascio/express-openapi-validator/issues/755
        // We make use of `links` in our OpenAPI spec, which is only supported in OpenAPI 3.1
        spec.apiDoc.openapi = '3.0.3';

        const { paths } = spec.apiDoc;
        Object.keys(paths).forEach((name) => {
            const path = paths[name];
            delete (path.delete as Record<string, unknown> | undefined)?.links;
            delete (path.get as Record<string, unknown> | undefined)?.links;
            delete (path.head as Record<string, unknown> | undefined)?.links;
            delete (path.options as Record<string, unknown> | undefined)?.links;
            delete (path.patch as Record<string, unknown> | undefined)?.links;
            delete (path.post as Record<string, unknown> | undefined)?.links;
            delete (path.put as Record<string, unknown> | undefined)?.links;
            delete (path.trace as Record<string, unknown> | undefined)?.links;
        });
    }

    spec.apiDoc.servers = [{ url: '/' }];

    if (extraOptions.validateApiSpec !== false) {
        spec = await loadSpec(spec.apiDoc, true);
    }

    const validator = middleware({
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
