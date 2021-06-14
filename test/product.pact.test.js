const getAllProducts = require('../test/states/getAllProducts');
const getProductsName = require('../test/states/getProductsName');
const getOneProduct = require('../test/states/getOneProduct');
const { Verifier } = require('@pact-foundation/pact');
const exec = require('child_process');
require('dotenv').config()

const url = 'http://localhost:';
const port = 4321;

// const gitBranch = exec.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const gitBranch = "${TRAVIS_BRANCH}";
const gitHash = exec.execSync('git rev-parse --short HEAD').toString().trim();

// Setup provider server to verify
const app = require('express')();
const authMiddleware = require('../src/middleware/auth.middleware');
app.use(authMiddleware);
app.use(require('../src/product/product.routes'));
const server = app.listen(port);

describe("Pact Verification", () => {
    it("Validates the expectations of getting all products api", () => {
        const baseOpts = {
            providerBaseUrl: `${url + port}`,
            providerVersion: gitHash,
            provider: process.env.PROVIDER_NAME,
            pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
            pactBrokerToken: process.env.PACT_BROKER_TOKEN,
            publishVerificationResult: true,
            providerVersionTags: gitBranch
        }

        const stateHandlers = Object.assign(getAllProducts, getProductsName, getOneProduct);

        const requestFilter = (req, res, next) => {
            if (!req.headers["authorization"]) {
                next();
                return;
            }
            req.headers["authorization"] = `Bearer ${new Date().toISOString()}`;
            next();
        }

        const consumerVersionSelectors = [
            {
                consumer: process.env.CONSUMER_NAME,
                tag: gitBranch,
                latest: true
            }
        ]

        const opts = {
            ...baseOpts,
            stateHandlers: stateHandlers,
            requestFilter: requestFilter,
            consumerVersionSelectors: consumerVersionSelectors
        };

        return new Verifier(opts).verifyProvider()
            .then(output => {
                console.log(output)
                console.log("Pact Verification Complete!")
            })
            .finally(() => {
                server.close();
            });
    })
});
