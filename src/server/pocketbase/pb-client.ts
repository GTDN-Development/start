import PocketBase from "pocketbase";

export function createPocketBaseClient() {
  return new PocketBase(getPocketBaseUrl());
}

export function getPocketBaseUrl() {
  const url = process.env.NEXT_PUBLIC_PB_URL;

  if (!url) {
    throw new Error("Missing PocketBase URL. Set NEXT_PUBLIC_PB_URL.");
  }

  return url;
}
