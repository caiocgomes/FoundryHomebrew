Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active) {
    ui.notifications.warn("libWrapper é necessário.");
    return;
  }

  libWrapper.register("new-combat-system", "CONFIG.Dice.DamageRoll.prototype.evaluate", function (wrapped, options) {
    // Interceptamos aqui a rolagem de dano — com acesso à fórmula e ao crit
    console.log("é critico: ",this.options.critical)
    if (this.options.critical && typeof this._formula === "string") {
      const originalFormula = this._formula;
      const newFormula = rewriteCriticalFormula(originalFormula);
      console.log("Interceptando fórmula de crítico:", this._formula);

      // Reescreve a fórmula crítica: 4d6 + 3 → (2d6 + 12) + 3
      this._formula = rewriteCriticalFormula(this._formula);
      console.log("Nova fórmula reescrita:", this._formula);
    
      console.log("This: ", this.terms);
      this.terms = Roll.parse(this._formula,this.options);
      console.log("This After: ", this.terms);
      this._flavor = `💥 Crítico personalizado: ${originalFormula} → ${newFormula}`;
    }
    return wrapped.call(this, options);
  }, "WRAPPER");
});


function rewriteCriticalFormula(formula) {
  const diceRegex = /(\d+)d(\d+)/g;
  let newFormula = formula;
  let match;
  const replacements = [];

  while ((match = diceRegex.exec(formula)) !== null) {
    const [full, qtdStr, facesStr] = match;
    const qtd = Number(qtdStr);
    const faces = Number(facesStr);

    if (qtd % 2 !== 0) continue;
    const halfQtd = qtd / 2;
    const max = halfQtd * faces;
    replacements.push({ full, replacement: `${halfQtd}d${faces} + ${max}` });
  }

  for (const { full, replacement } of replacements) {
    newFormula = newFormula.replace(full, replacement);
  }

  return newFormula;
}
