require("dotenv").config();
const http = require("http");

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { createClient } = require("@supabase/supabase-js");

// =======================
// ENV
// =======================
const TOKEN = (process.env.TOKEN || "").trim();
const CLIENT_ID = (process.env.CLIENT_ID || "").trim();
const GUILD_ID = (process.env.GUILD_ID || "").trim();

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || "").trim();

const CANAL_ANALISE_ID = (process.env.CANAL_ANALISE_ID || "").trim();
const CANAL_RESULTADO_ID = (process.env.CANAL_RESULTADO_ID || "").trim();
const CANAL_BEM_VINDO_ID = (process.env.CANAL_BEM_VINDO_ID || "").trim();

const CARGO_MEMBRO_ID = (process.env.CARGO_MEMBRO_ID || "").trim();
const CARGO_REGISTRO_ID = (process.env.CARGO_REGISTRO_ID || "").trim();

const PORT = process.env.PORT || 10000;

// =======================
// LOGS INICIAIS
// =======================
console.log("🚀 Iniciando bot...");
console.log("🧪 Variáveis carregadas:");
console.log(`- TOKEN: ${TOKEN ? "OK" : "FALTANDO"}`);
console.log(`- CLIENT_ID: ${CLIENT_ID ? "OK" : "FALTANDO"} (${CLIENT_ID || "vazio"})`);
console.log(`- GUILD_ID: ${GUILD_ID ? "OK" : "FALTANDO"} (${GUILD_ID || "vazio"})`);
console.log(`- SUPABASE_URL: ${SUPABASE_URL ? "OK" : "FALTANDO"}`);
console.log(`- SUPABASE_KEY: ${SUPABASE_KEY ? "OK" : "FALTANDO"}`);
console.log(`- CANAL_ANALISE_ID: ${CANAL_ANALISE_ID ? "OK" : "FALTANDO"}`);
console.log(`- CANAL_RESULTADO_ID: ${CANAL_RESULTADO_ID ? "OK" : "FALTANDO"}`);
console.log(`- CANAL_BEM_VINDO_ID: ${CANAL_BEM_VINDO_ID ? "OK" : "FALTANDO"}`);
console.log(`- CARGO_MEMBRO_ID: ${CARGO_MEMBRO_ID ? "OK" : "FALTANDO"}`);
console.log(`- CARGO_REGISTRO_ID: ${CARGO_REGISTRO_ID ? "OK" : "FALTANDO"}`);

if (
  !TOKEN ||
  !CLIENT_ID ||
  !GUILD_ID ||
  !SUPABASE_URL ||
  !SUPABASE_KEY ||
  !CANAL_ANALISE_ID ||
  !CANAL_RESULTADO_ID ||
  !CANAL_BEM_VINDO_ID ||
  !CARGO_MEMBRO_ID ||
  !CARGO_REGISTRO_ID
) {
  console.error("❌ Faltam variáveis obrigatórias.");
  process.exit(1);
}

// =======================
// WEB SERVER PARA RENDER
// =======================
http
  .createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("ok");
    }

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bot da Nova Ordem online.");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server online na porta ${PORT}`);
  });

// =======================
// CLIENTS
// =======================
// TESTE: removido GuildMembers temporariamente
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =======================
// DIAGNÓSTICO DISCORD
// =======================
client.on("debug", (msg) => {
  if (
    msg.includes("Hit a 429") ||
    msg.includes("Heartbeat") ||
    msg.includes("Session") ||
    msg.includes("Connecting") ||
    msg.includes("Ready")
  ) {
    console.log("🐞 DEBUG:", msg);
  }
});

client.on("error", (error) => {
  console.error("❌ Erro no client do Discord:", error);
});

client.on("warn", (info) => {
  console.warn("⚠️ Aviso do Discord:", info);
});

client.on("ready", () => {
  console.log("🟢 Evento ready disparou.");
});

client.on("shardReady", (id) => {
  console.log(`🟢 Shard ${id} pronta.`);
});

client.on("shardConnecting", (id) => {
  console.log(`🟡 Shard ${id} conectando...`);
});

client.on("shardReconnecting", (id) => {
  console.log(`🟠 Shard ${id} reconectando...`);
});

client.on("shardResume", (id, replayedEvents) => {
  console.log(`🔵 Shard ${id} retomou. Eventos replayed: ${replayedEvents}`);
});

client.on("shardDisconnect", (event, id) => {
  console.log(`🔌 Shard ${id} desconectada. Código: ${event.code}`);
});

client.on("shardError", (error, id) => {
  console.error(`❌ Erro na shard ${id}:`, error);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

// =======================
// COMANDOS
// =======================
function obterComandos() {
  return [
    new SlashCommandBuilder()
      .setName("registro-painel")
      .setDescription("Posta o painel de registro")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName("pendentes")
      .setDescription("Mostra registros pendentes")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName("ver-registro")
      .setDescription("Ver último registro de um usuário")
      .addUserOption((option) =>
        option
          .setName("usuario")
          .setDescription("Usuário para consultar")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ].map((cmd) => cmd.toJSON());
}

async function registrarComandos() {
  try {
    console.log("📝 Registrando comandos no Discord...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    const commands = obterComandos();

    await Promise.race([
      rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout ao registrar comandos.")), 15000)
      ),
    ]);

    console.log("✅ Comandos registrados com sucesso.");
  } catch (error) {
    console.error("❌ Falha ao registrar comandos:", error);
  }
}

// =======================
// FUNÇÕES VISUAIS
// =======================
function criarPainelRegistro() {
  return new EmbedBuilder()
    .setTitle("🔱 FACÇÃO NOVA ORDEM 🔱")
    .setDescription(
      [
        "📋 **Sistema de Registro da NOVA ORDEM**",
        "",
        "Para fazer parte da familia, você precisa realizar seu Registro.",
        "",
        "Clique no botão **Fazer Registro** abaixo.",
        "",
        "Após aprovação da liderança, seu acesso será liberado.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
      ].join("\n")
    )
    .setColor(0xff0000)
    .setThumbnail("https://cdn.discordapp.com/attachments/760881301217345588/1474207784965902336/19_de_fev._de_2026_11_51_12.png")
    .setImage("https://cdn.discordapp.com/attachments/760881301217345588/1474207784965902336/19_de_fev._de_2026_11_51_12.png")
    .setFooter({ text: "Nova Ordem • Sistema de Registro" })
    .setTimestamp();
}

function criarBotaoPainel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_registro")
      .setLabel("Fazer Registro")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Primary)
  );
}

function criarEmbedRegistro({
  titulo = "📋 Novo Registro para Análise",
  cor = 0xfee75c,
  userTag,
  userId,
  idRp,
  nomeRp,
  celularRp,
  cargoRp,
  status = "PENDENTE",
  analisadoPor = null,
  motivoNegacao = null,
}) {
  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setColor(cor)
    .addFields(
      { name: "Usuário Discord", value: `${userTag} (${userId})`, inline: false },
      { name: "Seu ID no RP", value: idRp || "Não informado", inline: true },
      { name: "Nome RP", value: nomeRp || "Não informado", inline: true },
      { name: "Celular RP", value: celularRp || "Não informado", inline: true },
      { name: "Cargo", value: cargoRp || "Não informado", inline: true },
      { name: "Status", value: status, inline: true }
    )
    .setTimestamp();

  if (analisadoPor) {
    embed.addFields({
      name: "Analisado por",
      value: analisadoPor,
      inline: false,
    });
  }

  if (motivoNegacao) {
    embed.addFields({
      name: "Motivo da negativa",
      value: motivoNegacao,
      inline: false,
    });
  }

  return embed;
}

function criarEmbedBoasVindas({ membro, idRp, celularRp, cargoRp }) {
  return new EmbedBuilder()
    .setTitle("🔱 NOVO MEMBRO DA NOVA ORDEM 🔱")
    .setDescription(
      [
        `> ${membro} agora faz parte da Favela.`,
        "",
        "📜 **Registro aprovado pela liderança.**",
        "A partir de agora é da familia porra.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "**📋 INFORMAÇÕES DO MEMBRO**",
      ].join("\n")
    )
    .addFields(
      { name: "🪪 ID DO RP", value: `\`${idRp || "Não informado"}\``, inline: true },
      { name: "📱 CELULAR", value: `\`${celularRp || "Não informado"}\``, inline: true },
      { name: "🎖️ CARGO", value: `\`${cargoRp || "Não informado"}\``, inline: true }
    )
    .setColor(0x8e44ad)
    .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
    .setFooter({ text: "Sistema de Registro • Facção" })
    .setTimestamp();
}

function criarBotoesAnalise(registroId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${registroId}`)
      .setLabel("Aprovar")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`negar_${registroId}`)
      .setLabel("Negar")
      .setStyle(ButtonStyle.Danger)
  );
}

function criarModalRegistro() {
  const modal = new ModalBuilder()
    .setCustomId("modal_registro")
    .setTitle("Registro no Servidor");

  const campoIdRp = new TextInputBuilder()
    .setCustomId("id_rp")
    .setLabel("Seu ID no RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Ex: 101");

  const campoNomeRp = new TextInputBuilder()
    .setCustomId("nome_rp")
    .setLabel("Nome no RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Ex: Rodrigo Silva");

  const campoCelularRp = new TextInputBuilder()
    .setCustomId("celular_rp")
    .setLabel("Celular RP")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Ex: 9999-0000");

  const campoCargoRp = new TextInputBuilder()
    .setCustomId("cargo_rp")
    .setLabel("Cargo")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Ex: Membro");

  modal.addComponents(
    new ActionRowBuilder().addComponents(campoIdRp),
    new ActionRowBuilder().addComponents(campoNomeRp),
    new ActionRowBuilder().addComponents(campoCelularRp),
    new ActionRowBuilder().addComponents(campoCargoRp)
  );

  return modal;
}

function criarModalNegacao(registroId) {
  const modal = new ModalBuilder()
    .setCustomId(`modal_negar_${registroId}`)
    .setTitle("Negar Registro");

  const motivo = new TextInputBuilder()
    .setCustomId("motivo_negacao")
    .setLabel("Motivo da negativa")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("Ex: Dados incorretos ou incompletos");

  modal.addComponents(new ActionRowBuilder().addComponents(motivo));
  return modal;
}

// =======================
// BANCO
// =======================
async function buscarRegistroPorId(id) {
  const { data, error } = await supabase
    .from("registros_discord")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function buscarRegistroPendenteDoUsuario(guildId, userId) {
  const { data, error } = await supabase
    .from("registros_discord")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .eq("status", "pendente")
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function buscarUltimoRegistroDoUsuario(guildId, userId) {
  const { data, error } = await supabase
    .from("registros_discord")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function buscarRegistrosPendentes(guildId) {
  const { data, error } = await supabase
    .from("registros_discord")
    .select("*")
    .eq("guild_id", guildId)
    .eq("status", "pendente")
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function atualizarRegistro(id, payload) {
  const { error } = await supabase
    .from("registros_discord")
    .update({
      ...payload,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

// =======================
// AUXILIARES
// =======================
async function apagarMensagemAnalise(registro) {
  try {
    if (!registro?.mensagem_analise_id) return false;

    const canalAnalise = await client.channels.fetch(CANAL_ANALISE_ID).catch(() => null);
    if (!canalAnalise) return false;

    const mensagem = await canalAnalise.messages
      .fetch(registro.mensagem_analise_id)
      .catch(() => null);

    if (!mensagem) return false;

    await mensagem.delete().catch(() => null);
    return true;
  } catch (error) {
    console.error("❌ Erro ao apagar mensagem de análise:", error);
    return false;
  }
}

async function enviarDMAprovado(usuario) {
  try {
    await usuario.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Registro aprovado")
          .setDescription("Seu registro foi aprovado. Bem-vindo ao servidor!")
          .setColor(0x57f287)
          .setTimestamp(),
      ],
    });
  } catch (error) {
    console.log(`⚠️ Não foi possível enviar DM para ${usuario.tag}`);
  }
}

async function enviarDMNegado(usuario, motivo) {
  try {
    await usuario.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Registro negado")
          .setDescription(`Seu registro foi negado.\n\n**Motivo:** ${motivo}`)
          .setColor(0xed4245)
          .setTimestamp(),
      ],
    });
  } catch (error) {
    console.log(`⚠️ Não foi possível enviar DM para ${usuario.tag}`);
  }
}

async function enviarMensagemBoasVindas({ membro, idRp, celularRp, cargoRp }) {
  try {
    const canalBemVindo = await client.channels.fetch(CANAL_BEM_VINDO_ID).catch(() => null);
    if (!canalBemVindo) return;

    const embed = criarEmbedBoasVindas({
      membro: `<@${membro.id}>`,
      idRp,
      celularRp,
      cargoRp,
    });

    await canalBemVindo.send({
      content: `🎉 Bem-vindo(a) <@${membro.id}>!`,
      embeds: [embed],
    });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem de boas-vindas:", error);
  }
}

// =======================
// READY
// =======================
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  console.log(`🆔 ID do bot: ${client.user.id}`);
  console.log(`🏠 Guild alvo configurada: ${GUILD_ID}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (guild) {
    console.log(`✅ Bot detectou a guild: ${guild.name} (${guild.id})`);
  } else {
    console.log("⚠️ Bot online, mas não encontrou a guild configurada no cache.");
  }

  await registrarComandos();
});

// =======================
// AO ENTRAR
// =======================
// OBS: com GuildMembers removido para teste, esse evento pode não funcionar como esperado
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    if (!member.guild || member.guild.id !== GUILD_ID) return;

    if (!member.roles.cache.has(CARGO_REGISTRO_ID)) {
      await member.roles.add(
        CARGO_REGISTRO_ID,
        "Novo membro entrou e recebeu cargo de registro"
      );
    }

    console.log(`✅ Cargo de registro adicionado para ${member.user.tag}`);
  } catch (error) {
    console.error("❌ Erro ao dar cargo de registro:", error);
  }
});

// =======================
// INTERAÇÕES
// =======================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem usar esse comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === "registro-painel") {
        await interaction.channel.send({
          embeds: [criarPainelRegistro()],
          components: [criarBotaoPainel()],
        });

        return interaction.reply({
          content: "✅ Painel de registro enviado.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === "pendentes") {
        const pendentes = await buscarRegistrosPendentes(interaction.guild.id);

        if (!pendentes.length) {
          return interaction.reply({
            content: "✅ Não há registros pendentes no momento.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const texto = pendentes
          .slice(0, 10)
          .map(
            (r) =>
              `**#${r.id}** • ${r.user_tag}\nNome RP: ${r.nome_rp}\nCelular RP: ${r.numero_rp}\nCargo: ${r.cargo_rp}`
          )
          .join("\n\n");

        const embed = new EmbedBuilder()
          .setTitle("📋 Registros Pendentes")
          .setDescription(texto)
          .setColor(0xfee75c)
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.commandName === "ver-registro") {
        const usuario = interaction.options.getUser("usuario", true);
        const registro = await buscarUltimoRegistroDoUsuario(interaction.guild.id, usuario.id);

        if (!registro) {
          return interaction.reply({
            content: "❌ Nenhum registro encontrado para esse usuário.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const embed = criarEmbedRegistro({
          titulo: `📄 Último Registro de ${usuario.tag}`,
          cor:
            registro.status === "aprovado"
              ? 0x57f287
              : registro.status === "negado"
              ? 0xed4245
              : 0xfee75c,
          userTag: registro.user_tag,
          userId: registro.user_id,
          idRp: registro.discord_id_informado,
          nomeRp: registro.nome_rp,
          celularRp: registro.numero_rp,
          cargoRp: registro.cargo_rp,
          status: registro.status.toUpperCase(),
          analisadoPor: registro.analisado_por,
          motivoNegacao: registro.motivo_negacao,
        });

        return interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.isButton() && interaction.customId === "abrir_registro") {
      const registroPendente = await buscarRegistroPendenteDoUsuario(
        interaction.guild.id,
        interaction.user.id
      );

      if (registroPendente) {
        return interaction.reply({
          content: "⚠️ Você já tem um registro pendente aguardando análise.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.showModal(criarModalRegistro());
    }

    if (interaction.isButton()) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem aprovar ou negar.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const [acao, registroId] = interaction.customId.split("_");
      if (!registroId) return;

      const registro = await buscarRegistroPorId(registroId);

      if (!registro) {
        return interaction.reply({
          content: "❌ Registro não encontrado.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (registro.status !== "pendente") {
        return interaction.reply({
          content: `⚠️ Esse registro já foi ${registro.status}.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (acao === "aprovar") {
        const guild = interaction.guild;
        const membroAlvo = await guild.members.fetch(registro.user_id).catch(() => null);

        if (!membroAlvo) {
          return interaction.reply({
            content: "❌ Não encontrei o usuário no servidor.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (membroAlvo.roles.cache.has(CARGO_REGISTRO_ID)) {
          await membroAlvo.roles.remove(
            CARGO_REGISTRO_ID,
            `Registro aprovado por ${interaction.user.tag}`
          );
        }

        if (!membroAlvo.roles.cache.has(CARGO_MEMBRO_ID)) {
          await membroAlvo.roles.add(
            CARGO_MEMBRO_ID,
            `Registro aprovado por ${interaction.user.tag}`
          );
        }

        await atualizarRegistro(registro.id, {
          status: "aprovado",
          analisado_por: `${interaction.user.tag} (${interaction.user.id})`,
        });

        const embedAprovado = criarEmbedRegistro({
          titulo: "✅ Registro Aprovado",
          cor: 0x57f287,
          userTag: registro.user_tag,
          userId: registro.user_id,
          idRp: registro.discord_id_informado,
          nomeRp: registro.nome_rp,
          celularRp: registro.numero_rp,
          cargoRp: registro.cargo_rp,
          status: "APROVADO",
          analisadoPor: `${interaction.user.tag} (${interaction.user.id})`,
        });

        const canalResultado = await client.channels.fetch(CANAL_RESULTADO_ID).catch(() => null);
        if (canalResultado) {
          await canalResultado.send({ embeds: [embedAprovado] });
        }

        await apagarMensagemAnalise(registro);
        await enviarDMAprovado(membroAlvo.user);

        await enviarMensagemBoasVindas({
          membro: membroAlvo,
          idRp: registro.discord_id_informado,
          celularRp: registro.numero_rp,
          cargoRp: registro.cargo_rp,
        });

        return interaction.reply({
          content: "✅ Registro aprovado com sucesso.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (acao === "negar") {
        return interaction.showModal(criarModalNegacao(registroId));
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === "modal_registro") {
      const registroPendente = await buscarRegistroPendenteDoUsuario(
        interaction.guild.id,
        interaction.user.id
      );

      if (registroPendente) {
        return interaction.reply({
          content: "⚠️ Você já tem um registro pendente aguardando análise.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const idRp = interaction.fields.getTextInputValue("id_rp").trim();
      const nomeRp = interaction.fields.getTextInputValue("nome_rp").trim();
      const celularRp = interaction.fields.getTextInputValue("celular_rp").trim();
      const cargoRp = interaction.fields.getTextInputValue("cargo_rp").trim();

      const { data: registroInserido, error: erroInsert } = await supabase
        .from("registros_discord")
        .insert({
          guild_id: interaction.guild.id,
          user_id: interaction.user.id,
          user_tag: interaction.user.tag,
          discord_id_informado: idRp,
          nome_rp: nomeRp,
          numero_rp: celularRp,
          cargo_rp: cargoRp,
          status: "pendente",
        })
        .select()
        .single();

      if (erroInsert) {
        console.error("❌ Erro ao inserir no Supabase:", erroInsert);
        return interaction.reply({
          content: "❌ Não consegui salvar seu registro no banco.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const canalAnalise = await client.channels.fetch(CANAL_ANALISE_ID).catch(() => null);

      if (!canalAnalise) {
        return interaction.reply({
          content: "❌ Não encontrei o canal de análise.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embedAnalise = criarEmbedRegistro({
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        idRp,
        nomeRp,
        celularRp,
        cargoRp,
        status: "PENDENTE",
      });

      const msgAnalise = await canalAnalise.send({
        embeds: [embedAnalise],
        components: [criarBotoesAnalise(registroInserido.id)],
      });

      await atualizarRegistro(registroInserido.id, {
        mensagem_analise_id: msgAnalise.id,
      });

      return interaction.reply({
        content: "✅ Seu registro foi enviado para análise. Aguarde a administração.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_negar_")) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: "❌ Apenas administradores podem negar registros.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const registroId = interaction.customId.replace("modal_negar_", "");
      const motivoNegacao = interaction.fields.getTextInputValue("motivo_negacao").trim();

      const registro = await buscarRegistroPorId(registroId);

      if (!registro) {
        return interaction.reply({
          content: "❌ Registro não encontrado.",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (registro.status !== "pendente") {
        return interaction.reply({
          content: `⚠️ Esse registro já foi ${registro.status}.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await atualizarRegistro(registro.id, {
        status: "negado",
        analisado_por: `${interaction.user.tag} (${interaction.user.id})`,
        motivo_negacao: motivoNegacao,
      });

      const embedNegado = criarEmbedRegistro({
        titulo: "❌ Registro Negado",
        cor: 0xed4245,
        userTag: registro.user_tag,
        userId: registro.user_id,
        idRp: registro.discord_id_informado,
        nomeRp: registro.nome_rp,
        celularRp: registro.numero_rp,
        cargoRp: registro.cargo_rp,
        status: "NEGADO",
        analisadoPor: `${interaction.user.tag} (${interaction.user.id})`,
        motivoNegacao,
      });

      const canalResultado = await client.channels.fetch(CANAL_RESULTADO_ID).catch(() => null);
      if (canalResultado) {
        await canalResultado.send({ embeds: [embedNegado] });
      }

      await apagarMensagemAnalise(registro);

      const usuarioAlvo = await client.users.fetch(registro.user_id).catch(() => null);
      if (usuarioAlvo) {
        await enviarDMNegado(usuarioAlvo, motivoNegacao);
      }

      return interaction.reply({
        content: "✅ Registro negado com sucesso.",
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    console.error("❌ Erro geral:", error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Ocorreu um erro ao processar a solicitação.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao processar a solicitação.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (e) {
      console.error("❌ Erro ao responder interação:", e);
    }
  }
});

// =======================
// INICIAR
// =======================
(async () => {
  try {
    console.log("🔗 Testando conexão com Supabase...");
    const { error: testError } = await supabase
      .from("registros_discord")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Supabase respondeu com erro:", testError);
    } else {
      console.log("✅ Supabase conectado com sucesso.");
    }

    console.log("🔐 Tentando login no Discord Gateway...");
    console.log("🧪 Intents ativas:", client.options.intents);

    const loginPromise = client.login(TOKEN);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      console.log(`⏳ Aguardando login do Discord... ${tick * 5}s`);
    }, 5000);

    const timeout = setTimeout(() => {
      console.error("❌ Login tentando no Discord travou por 30s. Encerrando processo...");
      clearInterval(interval);
      process.exit(1);
    }, 30000);

    loginPromise
      .then((result) => {
        clearTimeout(timeout);
        clearInterval(interval);
        console.log("✅ client.login resolveu com sucesso.");
        console.log("✅ Login no Discord enviado.");
        return result;
      })
      .catch((err) => {
        clearTimeout(timeout);
        clearInterval(interval);
        console.error("❌ Erro no login do Discord:", err);
        process.exit(1);
      });
  } catch (err) {
    console.error("❌ Erro ao iniciar o bot:", err);
    process.exit(1);
  }
})();