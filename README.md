# oav-installer

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=myrotvorets_oav-installer&metric=alert_status)](https://sonarcloud.io/dashboard?id=myrotvorets_oav-installer)
[![Build and Test](https://github.com/myrotvorets/oav-installer/actions/workflows/build.yml/badge.svg)](https://github.com/myrotvorets/oav-installer/actions/workflows/build.yml)
[![codebeat badge](https://codebeat.co/badges/f52e3ff4-8832-4da4-af44-5ca3ea111b9d)](https://codebeat.co/projects/github-com-myrotvorets-oav-installer-master)

This package is internally used by our microservices.

All it does is:
1. Loads the OpenAPI specification.
2. Transforms it (public and private services handle some parts differently)
3. Configures `express-openapi-validator`
4. Installs `express-openapi-validator` into the Express application
