Hooks.once("ready", () => {
    console.log("Critical Damage Enhancer loaded");
  
    if (!game?.modules?.get("lib-wrapper")?.active) {
      ui.notifications.warn("O módulo 'libWrapper' é necessário para o módulo de dano crítico.");
      return;
    }
  
    libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollDamage", async function (wrapped, ...args) {
      
      const [config = {}, options = {}] = args;
        
      // Chama a função original para obter o resultado base
      const damageRoll = await wrapped(...args);
      
      console.log("config: ",config)
      // Só modifica se for dano crítico
      if (!damageRoll.isCritical) {
        console.log("config: ",config)
        console.log("Dano normal: ",damageRoll)
        return damageRoll;
      }
      console.log("Interceptando jogada critica (dano)",this)
  
      // Pega a fórmula original da rolagem
      const originalFormula = damageRoll._formula;
      console.log("Formula dano: ",originalFormula)

      // Usa RegEx para encontrar os dados (ex: 2d6, 1d8)
      const diceRegex = /(\d+)d(\d+)/g;
      let maxDiceTotal = 0;
      let match;
      while ((match = diceRegex.exec(originalFormula)) !== null) {
        const [_, qtd, faces] = match;
        maxDiceTotal += parseInt(qtd) * parseInt(faces);
      }
  
      // Valor total final: rolagem + máximo dos dados
      const newTotal = damageRoll.total + maxDiceTotal;
      console.log("Dano total: ",newTotal)
      // Atualiza o flavor e mostra o novo valor no chat
      damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `💥 Dano Crítico (Máximo dos Dados + Rolagem + Bônus): ${damageRoll.total} + ${maxDiceTotal} = ${newTotal}`,
      });
  
      // Sobrescreve o total (nota: isso afeta só a exibição, não refaz o Roll internamente)
      damageRoll._total = newTotal;
      return damageRoll;
    }, "WRAPPER");
  });
  