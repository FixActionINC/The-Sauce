import { SquareClient, SquareEnvironment } from "square";

/**
 * Shared Square client singleton (lazy-initialized).
 *
 * Initialization is deferred to first access so that the build step does
 * not fail when SQUARE_ACCESS_TOKEN is unavailable (e.g. during static page
 * generation in CI). At runtime, the getter throws immediately if the
 * token is missing.
 */

let _client: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!_client) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "SQUARE_ACCESS_TOKEN is not set. Add it to your environment variables.",
      );
    }
    _client = new SquareClient({
      token: accessToken,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }
  return _client;
}

/**
 * Return the Square location ID from environment variables.
 * Every Square payment is tied to a location.
 */
export function getLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error(
      "SQUARE_LOCATION_ID is not set. Add it to your environment variables.",
    );
  }
  return locationId;
}
