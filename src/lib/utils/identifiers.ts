import {
  adjectives,
  names,
  uniqueNamesGenerator,
} from "unique-names-generator";

export function generateBatchId(): string {
  return crypto.randomUUID();
}

export function generateAgentId(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, names],
    separator: "_",
    length: 2,
    style: "lowerCase",
  });
}
