Hooks.once("ready", () => {
  console.log("Custom Defense Bonus system with button loaded");

  if (!game?.modules?.get("lib-wrapper")?.active) {
    ui.notifications.warn("The 'libWrapper' module is required for Custom Defense Bonus to function correctly.");
    return;
  }

  libWrapper.register("my-defense-module", "CONFIG.Actor.documentClass.prototype.rollWeaponAttack", async function (wrapped, ...args) {
    const attackRoll = await new Roll("1d20 + @attributes.prof").roll({async: true});
    const attacker = this;
    const targets = Array.from(game.user?.targets ?? []);
    if (targets.length === 0) return wrapped(...args);
    const target = targets[0].actor;

    const content = `
      <strong>${attacker.name}</strong> attacks <strong>${target.name}</strong>:<br>
      Attack Roll: <strong>${attackRoll.total}</strong><br>
      <button data-attacker="${attacker.id}" data-attack-roll="${attackRoll.total}" data-target="${target.id}" class="roll-defense-button">Roll Defense</button>
    `;

    ChatMessage.create({ content });

    return true;
  }, "WRAPPER");

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
