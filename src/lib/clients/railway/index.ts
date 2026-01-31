/**
 * Railway GraphQL API Client
 * Only implements what we need: service creation, config, and domain
 */

import type {
  EnvironmentPatchCommitResponse,
  GraphQLResponse,
  ServiceCreateResponse,
  ServiceDomainCreateResponse,
} from "./types";

export * from "./types";

const RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2";

async function request<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = process.env.RAILWAY_API_TOKEN;
  if (!token) {
    throw new Error("RAILWAY_API_TOKEN environment variable required");
  }

  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Railway API error: ${response.status}`);
  }

  const result = (await response.json()) as GraphQLResponse<T>;

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Railway GraphQL error: ${result.errors[0]?.message}`);
  }

  if (!result.data) {
    throw new Error("Railway API returned no data");
  }

  return result.data;
}

/**
 * Create a service from a GitHub repo
 */
export async function createService(
  projectId: string,
  name: string,
  repo: string,
): Promise<string> {
  const query = `
    mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
      }
    }
  `;

  const data = await request<ServiceCreateResponse>(query, {
    input: { projectId, name, source: { repo } },
  });

  return data.serviceCreate.id;
}

/**
 * Set service config (rootDirectory, etc.) and deploy
 */
export async function configureService(
  environmentId: string,
  serviceId: string,
  rootDirectory: string,
): Promise<void> {
  const query = `
    mutation environmentPatchCommit(
      $environmentId: String!
      $patch: EnvironmentConfig
    ) {
      environmentPatchCommit(
        environmentId: $environmentId
        patch: $patch
      )
    }
  `;

  await request<EnvironmentPatchCommitResponse>(query, {
    environmentId,
    patch: {
      services: {
        [serviceId]: {
          source: { rootDirectory },
        },
      },
    },
  });
}

/**
 * Generate a railway.app domain for a service
 */
export async function createDomain(
  serviceId: string,
  environmentId: string,
): Promise<string> {
  const query = `
    mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        domain
      }
    }
  `;

  const data = await request<ServiceDomainCreateResponse>(query, {
    input: { serviceId, environmentId },
  });

  return `https://${data.serviceDomainCreate.domain}`;
}
