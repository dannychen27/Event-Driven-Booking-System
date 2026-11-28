export class InvalidGeminiSearchPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGeminiSearchPlanError';
  }
}
