Hooks.once("ready", () => {
  console.log("Custom Defense Bonus system with button loaded");

  if (!game?.modules?.get("lib-wrapper")?.active) {
    ui.notifications.warn("The 'libWrapper' module is required for Custom Defense Bonus to function correctly.");
    return;
  }


  Hooks.once("init", () => {
  console.log("Skill System | Substituindo árvore de perícias...");

  CONFIG.DND5E.skills = {
    acr: { label: "Acrobatics", ability: "dex" },
    arc: { label: "Arcana", ability: "int" },
    ath: { label: "Athletics", ability: "str" },
    sne: { label: "Sneak", ability: "dex" },
    surv: { label: "Survival", ability: "wis" },
    thievery: { label: "Thievery", ability: "dex" },
    intimidate: { label: "Intimidate", ability: "cha" },
    diplomacy: { label: "Diplomacy", ability: "cha" },
    knowledgeHistory: { label: "Knowledge (History)", ability: "int" },
    knowledgeArcana: { label: "Knowledge (Arcana)", ability: "int" },
    useMagicDevice: { label: "Use Magic Device", ability: "cha" },
    // etc. Você pode criar quantas quiser
  };
});

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
        ui.notifications.warn("Ator não encontrado para esta rolagem de defesa.");
        return;
      }

      const defenseBonus = actor.system.attributes.ac.value - 10;
      const formula = `1d20 + ${defenseBonus}`;
      const defenseRoll = await new Roll(formula).roll({ async: true });
      await defenseRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `🛡️ Defesa Ativa de <strong>${actor.name}</strong>`,
      });

      console.log(`Rolando defesa para ${actor.name}`);
    });

     html.find(".total-defense").on("click", async (event) => {
      event.preventDefault();

      const messageId = event.currentTarget.dataset.messageId;
      console.log("Botão clicado Total!", messageId);

      const chatMessage = game.messages.get(messageId);
      if (!chatMessage) { 
        console.log("not chat: ",chatMessage)
        return;
      }

      const actor = ChatMessage.getSpeakerActor(chatMessage.speaker);
      if (!actor) {
        ui.notifications.warn("Ator não encontrado para esta rolagem de defesa.");
        return;
      }

      const defenseBonus = actor.system.attributes.ac.value - 10;
      const proficiency =  actor.system.attributes.prof
      console.log("Defese Total: ",defenseBonus)
      const formula = `1d20 + ${defenseBonus} + ${proficiency}`;
      const defenseRoll = await new Roll(formula).roll({ async: true });
      await defenseRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `🛡️ Defesa Total de <strong>${actor.name}</strong>`,
      });

      console.log(`Rolando defesa total para ${actor.name}`);
    });
  });

  // Wrapper do ataque
  libWrapper.register("new-combat-system", "CONFIG.Item.documentClass.prototype.rollAttack", async function (wrapped, ...args) {
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
      content: "Carregando botões...",
    });

      const htmlContent = `
  <button class="defense-roll" data-message-id="${message.id}">🎯 Defesa</button><br>
  <button class="total-defense" data-message-id="${message.id}">🛡️ Defesa Total</button>
`;
    await message.update({ content: htmlContent });

      
    }
    
    return attackRoll;

  }, "WRAPPER");
});
