import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a successful liveness response', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
