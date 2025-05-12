Hooks.once("ready", () => {
    console.log("Critical Damage Enhancer loaded");
  
    if (!game?.modules?.get("lib-wrapper")?.active) {
      ui.notifications.warn("O módulo 'libWrapper' é necessário para o módulo de dano crítico.");
      return;
    }
  
    libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollDamage", async function (_wrapped, config = {}, options = {}) {
        // Detecta se é crítico pelo config
        const isCritical = Boolean(config.critical);
        if (!isCritical) {
          // Não crítico: chama o fluxo normal, sem interferir
          return this.rollDamage._wrapped(config, options);
        }
  
        // === Fluxo de crítico personalizado ===
        // 1) Monta a fórmula original de dano (ex: "2d6 + 3")
        const parts = this.data.data.damage.parts.map(p => p[0]);
        const formula = parts.join(" + ");
        const rollData = this.actor.getRollData();
  
        // 2) Rola o dano normal
        const damageRoll = await new Roll(formula, rollData).roll({ async: true });
  
        // 3) Calcula o máximo possível dos dados
        const diceRegex = /(\d+)d(\d+)/g;
        let match, maxDice = 0;
        while ((match = diceRegex.exec(formula))) {
          const [ , qtd, faces ] = match;
          maxDice += Number(qtd) * Number(faces);
        }
  
        // 4) Soma o máximo ao total da rolagem
        const newTotal = damageRoll.total + maxDice;
        damageRoll._total = newTotal;
  
        // 5) Envia a sua mensagem explicando o cálculo
        damageRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `💥 Crítico: máximo dos dados (${maxDice}) + rolagem (${damageRoll.total - rollData.abilities?.prof || 0}) + bônus = ${newTotal}`
        });
  
        // Fim do OVERRIDE: não chama o wrapped original
        return damageRoll;
      },
      "OVERRIDE"
    );
  });
  

