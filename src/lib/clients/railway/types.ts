/**
 * Railway GraphQL API Types
 */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface ServiceCreateResponse {
  serviceCreate: { id: string };
}

export interface ServiceDomainCreateResponse {
  serviceDomainCreate: { domain: string };
}

export interface EnvironmentPatchCommitResponse {
  environmentPatchCommit: string;
}
