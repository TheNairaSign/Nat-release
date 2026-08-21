export type HealthStatus = {
  ok: boolean;
};

export function isHealthy(status: HealthStatus): boolean {
  return status.ok === true;
}
