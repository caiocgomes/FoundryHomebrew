Hooks.once("ready", () => {
  console.log("Custom Defense Bonus system with button loaded");

  if (!game?.modules?.get("lib-wrapper")?.active) {
    ui.notifications.warn("The 'libWrapper' module is required for Custom Defense Bonus to function correctly.");
    return;
  }

  libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollAttack", async function (wrapped, ...args) {
    console.log("Interceptando ataque", this);

    // Sempre execute a rolagem original primeiro
    const attackRoll = await wrapped(...args);

    const attacker = this;
    const targets = Array.from(game.user.targets);
    if (targets.length === 0) {
      ui.notifications.warn("Nenhum alvo selecionado para o ataque!");
      return attackRoll;  // Está tudo certo, pois o wrapped foi chamado
    }

    const target = targets[0];
    const targetActor = target.actor;

    const message = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: targetActor }),
      content: `<button class="defense-roll">Rolar Defesa</button>`,
    });

    Hooks.once("renderChatMessage", (msg, html, data) => {
      html.find(".defense-roll").click(async () => {
        const defenseBonus = targetActor.system.attributes.ac.value - 10;
        const formula = `1d20 + ${defenseBonus}`;
        const defenseRoll = await new Roll(formula).roll({ async: true });
        defenseRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: targetActor }),
          flavor: "Defesa Ativa",
        });

        // Aqui você pode comparar os valores
        console.log(`Ataque: ${attackRoll.total} vs Defesa: ${defenseRoll.total}`);
      });
    });

    return attackRoll;
  }, "WRAPPER");
});
