describe("crearDependencias", () => {
  it("retorna todas las dependencias", async () => {
    const { crearDependencias } = await import("@/shared/di/crearDependencias");
    const deps = crearDependencias();

    expect(deps.usuarioRepo).toBeDefined();
    expect(deps.gastoRepo).toBeDefined();
    expect(deps.grupoRepo).toBeDefined();
    expect(deps.deudaRepo).toBeDefined();
    expect(deps.sesionRepo).toBeDefined();
    expect(deps.tokenRecuperacionRepo).toBeDefined();
    expect(deps.divisionGastoRepo).toBeDefined();
    expect(deps.miembroGrupoRepo).toBeDefined();
    expect(deps.db).toBeDefined();
  });

  it("retorna las mismas instancias en llamadas sucesivas (singleton)", async () => {
    const { crearDependencias } = await import("@/shared/di/crearDependencias");
    const a = crearDependencias();
    const b = crearDependencias();
    expect(a.usuarioRepo).toBe(b.usuarioRepo);
  });
});
