const mockTransaction = jest.fn((fn) => fn({}));
jest.mock("@/shared/libs/prisma", () => ({
  prisma: { $transaction: mockTransaction },
}));

describe("PrismaDatabaseService", () => {
  it("llama a prisma.$transaction con la función", async () => {
    const { PrismaDatabaseService } =
      await import("@/shared/libs/prismaDatabaseService");
    const fn = jest.fn().mockResolvedValue("resultado");
    const resultado = await PrismaDatabaseService.transaction(fn);
    expect(mockTransaction).toHaveBeenCalledWith(fn);
    expect(resultado).toBe("resultado");
  });
});
