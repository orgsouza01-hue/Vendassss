const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cria')
        .setDescription('Criar cupom')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('cupom')
            .addStringOption(o => o.setName('nome').setRequired(true))
            .addNumberOption(o => o.setName('desconto').setRequired(true).setMinValue(1).setMaxValue(100))
            .addStringOption(o => o.setName('validade').setRequired(true)
                .addChoices({name:'1 dia',value:'1d'},{name:'7 dias',value:'7d'},{name:'30 dias',value:'30d'},{name:'90 dias',value:'90d'}))
        ),
    async execute(interaction, client) {
        const nome = interaction.options.getString('nome');
        const desc = interaction.options.getNumber('desconto');
        const dias = parseInt(interaction.options.getString('validade'));
        const exp = moment().add(dias, 'days').toDate().toISOString();
        const id = client.db.addCoupon(interaction.guild.id, nome, desc, exp);
        if (!id) return interaction.reply({ content: '❌ Cupom já existe!', ephemeral: true });
        await interaction.reply({ content: `✅ Cupom **${nome}** criado! ${desc}% OFF | ${dias} dias`, ephemeral: true });
    }
};
