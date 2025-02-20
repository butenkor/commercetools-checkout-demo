import { ClientBuilder } from '@commercetools/ts-client';
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

const PORT=process.env.PORT;
const CTP_PROJECT_KEY = process.env.CTP_PROJECT_KEY;
const CTP_CLIENT_ID = process.env.CTP_CLIENT_ID;
const CTP_CLIENT_SECRET = process.env.CTP_CLIENT_SECRET;
const CTP_AUTH_URL = process.env.CTP_AUTH_URL;
const CTP_API_URL = process.env.CTP_API_URL;
const CHECKOUT_REGION = process.env.CHECKOUT_REGION;
const CHECKOUT_APPLICATION_KEY = process.env.CHECKOUT_APPLICATION_KEY;

// Use fileURLToPath to get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" directory located in the root folder
app.use(express.static(path.join(__dirname, 'public')));

// CoCo SDK can not return or generate access token OOTB so we woraround with tokenCache
function _tokenCache(val) {
    let initialVal = val
    return {
        get() {
            return initialVal
        },
        set(value) {
            initialVal = value
        }
    }
}

// prefill the token cache with an empty object to avoid undefined errors on i.e tokenCache.get()
// alternatively, one could make just separate auth call to CoCo Auth API to get the token (with fetch, no SDK)
const tokenCache = _tokenCache({})


// Set up the auth and API middleware options for the client
const authMiddlewareOptions = {
    credentials: {
        clientId: CTP_CLIENT_ID,
        clientSecret: CTP_CLIENT_SECRET,
    },
    host: CTP_AUTH_URL,
    projectKey: CTP_PROJECT_KEY,
    tokenCache,
};

const httpMiddlewareOptions = {
    host: CTP_API_URL,
    httpClient: fetch,
};

// Initialize the commercetools client with the middleware
const client = new ClientBuilder()
.withHttpMiddleware(httpMiddlewareOptions)
.withClientCredentialsFlow(authMiddlewareOptions)
.build();

const apiRoot = createApiBuilderFromCtpClient(client);

// Retrieve the cached access token from the SDK
async function getAccessToken() {
    try {
        const cachedToken = tokenCache.get();
        if(!cachedToken)
            // make dummy request to get the access token
            await apiRoot.withProjectKey({ projectKey: CTP_PROJECT_KEY }).get().execute();
        
        return cachedToken.token;
    } catch (error) {
        console.error("Error fetching access token:", error);
        throw new Error("Failed to retrieve API access token");
    }
}

// Endpoint to create a checkout session
app.post('/create-session', async (req, res) => {
    console.log("Start session creation...");
    try {
        // Create or get an existing cart
        const cart = await createCart();
        // Get the cached access token from the SDK
        const authToken = await getAccessToken();
        
        const payload = {
            cart: {
                cartRef: {
                    id: cart.id
                }
            },
            metadata: {
                applicationKey: CHECKOUT_APPLICATION_KEY
            }
        };
        const jsonString = JSON.stringify(payload);
        
        const response = await fetch(`https://session.${CHECKOUT_REGION}.commercetools.com/${CTP_PROJECT_KEY}/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        const sessionData = await response.json();
        console.log(sessionData);
        const data = {
            sessionId: sessionData.id,
            projectKey: CTP_PROJECT_KEY,
            region: CHECKOUT_REGION,
        }
        res.json(data);
    } catch (error) {
        console.error("Checkout session error:", error);
        res.status(500).json({ message: error.message });
    }
});

async function createCart() {
    // shippingAddress is required for the paymentFlow
    // For the checkoutFlow it can be removed
    const cartDraft = {
        currency: "EUR",
        country: "DE",
        shippingAddress: {
            country: "DE",
        },
        lineItems: [{
            sku: "myCam123",
            quantity: 1,
        }]
    };
    const cart = await apiRoot
    .withProjectKey({projectKey: CTP_PROJECT_KEY})
    .carts()
    .post({body: cartDraft})
    .execute();
    
    return cart.body;
}

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
