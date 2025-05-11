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


    // Envia uma mensagem no chat para que o alvo role sua defesa
    const message = await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: targetActor }),
      content: `<button class="defense-roll">Rolar Defesa</button>`,
    });
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

