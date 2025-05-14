Hooks.once("ready", () => {
  console.log("Custom Defense Bonus system with button loaded");

  if (!game?.modules?.get("lib-wrapper")?.active) {
    ui.notifications.warn(
      "The 'libWrapper' module is required for Custom Defense Bonus to function correctly."
    );
    return;
  }

  // Hook global – só registra uma vez
  Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".defense-roll").on("click", async (event) => {
      event.preventDefault();

      const messageId = event.currentTarget.dataset.messageId;
      console.log("Botão clicado!", messageId);

      const chatMessage = game.messages.get(messageId);
      if (!chatMessage) return;

      const actor = ChatMessage.getSpeakerActor(chatMessage.speaker);
      if (!actor) {
        ui.notifications.warn(
          "Ator não encontrado para esta rolagem de defesa."
        );
        return;
      }

      const defenseBonus = actor.system.attributes.ac.value - 10;
      const formula = `1d20 + ${defenseBonus}`;

      await dnd5e.dice.d20Roll({
        actor,
        data: actor.getRollData(),
        parts: [defenseBonus],
        title: `🛡️ Defesa Ativa de ${actor.name}`,
        flavor: `🛡️ Defesa Ativa de <strong>${actor.name}</strong>`,
        fastForward: false,
        rollMode: game.settings.get("core", "rollMode"),
      });

      console.log(`Rolando defesa para ${actor.name}`);
    });
  });

  // Wrapper do ataque
  libWrapper.register(
    "new-combat-system",
    "CONFIG.Item.documentClass.prototype.rollAttack",
    async function (wrapped, ...args) {
      console.log("Interceptando ataque", this);

      const attackRoll = await wrapped(...args);

      const targets = Array.from(game.user.targets);
      if (targets.length === 0) {
        ui.notifications.warn("Nenhum alvo selecionado para o ataque!");
        return attackRoll;
      }

      for (const target of targets) {
        const targetActor = target.actor;

        const message = await ChatMessage.create({
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: targetActor }),
          content: `<button class="defense-roll" data-message-id="PLACEHOLDER">🎯 Rolar Defesa</button>`,
        });

        const updatedContent = message.content.replace(
          "PLACEHOLDER",
          message.id
        );
        await message.update({ content: updatedContent });
      }

      return attackRoll;
    },
    "WRAPPER"
  );
});
