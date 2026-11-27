const LOCAL_HOSTS = new Set(["127.0.0.1:3421", "localhost:3421", "[::1]:3421"]);
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

export const SYNTHETIC_HEADER = "x-fengweilou-synthetic";

export function trustedSyntheticRequest({ host, marker, remoteAddress }) {
  return marker === "1" && LOCAL_HOSTS.has(host ?? "") && LOOPBACK_ADDRESSES.has(remoteAddress ?? "");
}
