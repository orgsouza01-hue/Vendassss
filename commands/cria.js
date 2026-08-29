const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cria')
        .setDescription('Criar cupom de desconto')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('cupom')
            .setDescription('Criar novo cupom')
            .addStringOption(o => o.setName('nome').setRequired(true))
            .addNumberOption(o => o.setName('desconto').setDescription('% de desconto').setRequired(true).setMinValue(1).setMaxValue(100))
            .addStringOption(o => o.setName('validade').setRequired(true)
                .addChoices({name:'1 dia',value:'1d'},{name:'7 dias',value:'7d'},{name:'30 dias',value:'30d'},{name:'90 dias',value:'90d'}))
        ),

    async execute(interaction, client) {
        const nome = interaction.options.getString('nome');
        const desconto = interaction.options.getNumber('desconto');
        const validade = interaction.options.getString('validade');
        const dias = parseInt(validade);
        const expira = moment().add(dias, 'days').toDate().toISOString();

        const id = client.db.addCoupon(interaction.guild.id, nome, desconto, expira);
        if (!id) return interaction.reply({ content: '❌ Cupom já existe!', ephemeral: true });

        await interaction.reply({ 
            content: `✅ Cupom **${nome}** criado!\n📉 ${desconto}% OFF\n⏰ Validade: ${dias} dias`, 
            ephemeral: true 
        });
    }
};
