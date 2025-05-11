Hooks.once("ready", () => {
    console.log("Critical Damage Enhancer loaded");
  
    if (!game?.modules?.get("lib-wrapper")?.active) {
      ui.notifications.warn("O módulo 'libWrapper' é necessário para o módulo de dano crítico.");
      return;
    }
  
    libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollDamage", async function (...args) {
        const [config = {}, options = {}] = args;
      
        // Garante que ainda é executado como dano crítico
        
      
        // Executa o Roll normalmente
        const damageRoll = await this.damageRoll(config);
        const isCritical = damageRoll.isCritical ;
        // Calcula bônus de máximo do dado apenas se crítico
        if (isCritical) {
          let maxBonus = 0;
          for (let term of damageRoll.terms) {
            if (term instanceof Die && term.options.critical) {
              maxBonus += term.faces * term.number;
            }
          }
      
          const newTotal = damageRoll.total + maxBonus;
      
          // Substitui a mensagem original por sua própria
          damageRoll._total = newTotal;
          return damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: `💥 Dano Crítico Ajustado: Rolagem + Máximo = ${damageRoll.total} + ${maxBonus} = ${newTotal}`
          });
        }
      
        // Se não for crítico, mostra normalmente
        return damageRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: "Dano normal"
        });
      }, "OVERRIDE");
      
  });
  

