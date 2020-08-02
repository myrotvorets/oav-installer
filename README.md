# oav-installer

![Build and Test CI](https://github.com/myrotvorets/oav-installer/workflows/Build%20and%20Test%20CI/badge.svg)

This package is internally used by our microservices.

All it does is:
1. Loads the OpenAPI specification.
2. Transforms it (public and private services handle some parts differently)
3. Configures `express-openapiu-validator`
4. Installs `express-openapiu-validator` into the Express application
