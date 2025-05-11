Hooks.once("ready", () => {
  console.log("Custom Defense Bonus system with button loaded");

  if (!game?.modules?.get("lib-wrapper")?.active) {
    ui.notifications.warn("The 'libWrapper' module is required for Custom Defense Bonus to function correctly.");
    return;
  }

  libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollAttack", async function (wrapped, ...args) {
    console.log("Interceptando ataque", this)
    const attackRoll = await new Roll("1d20 + @attributes.prof").roll({async: true});
    const attacker = this;
    const targets = Array.from(game.user.targets);
    if (targets.length === 0) {
      ui.notifications.warn("Nenhum alvo selecionado para o ataque!");
      return attackRoll;
    }

    const target = targets[0]; // Pega o primeiro token alvo
    const targetActor = target.actor;

    // Escuta clique no botão
    Hooks.once("renderChatMessage", (msg, html, data) => {
      html.find(".defense-roll").click(async () => {
        const defenseBonus = targetActor.system.attributes.ac.value - 10;
        const defenseRoll = await new Roll("1d20 + ${defenseBonus}", targetActor.getRollData()).roll({ async: true });
        defenseRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: targetActor }),
          flavor: "Defesa Ativa",
        });

        // Aqui você pode comparar defesaRoll.total com attackRoll.total
        // e decidir se o ataque acerta ou não
      });
    });

    return attackRoll;
  }, "WRAPPER");
});

  // Listen for button click
  Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".roll-defense-button").click(async (event) => {
      const button = event.currentTarget;
      const attackerId = button.dataset.attacker;
      const attackRollTotal = parseInt(button.dataset.attackRoll, 10);
      const targetId = button.dataset.target;

      const targetActor = game.actors.get(targetId);
      if (!targetActor) return;

      const defenseBonus = targetActor.system.attributes.ac.value - 10;
      const defenseRoll = await new Roll(`1d20 + ${defenseBonus}`).roll({async: true});
      const hit = attackRollTotal > defenseRoll.total;

      const resultContent = `
        <strong>${targetActor.name}</strong> defends:<br>
        Defense Roll: <strong>${defenseRoll.total}</strong><br>
        <strong>${hit ? "Hit!" : "Miss!"}</strong>
      `;
      ChatMessage.create({ content: resultContent });
    });
  });
});
