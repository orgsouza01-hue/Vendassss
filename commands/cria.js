const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cria')
        .setDescription('Criar cupom de desconto')
        .addSubcommand(subcommand =>
            subcommand.setName('cupom')
                .setDescription('Criar um novo cupom de desconto')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('Nome do cupom')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('desconto')
                        .setDescription('Porcentagem de desconto (ex: 10 para 10%)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addStringOption(option =>
                    option.setName('validade')
                        .setDescription('Tempo de validade')
                        .setRequired(true)
                        .addChoices(
                            { name: '1 dia', value: '1d' },
                            { name: '3 dias', value: '3d' },
                            { name: '7 dias (1 semana)', value: '7d' },
                            { name: '15 dias', value: '15d' },
                            { name: '30 dias (1 mês)', value: '30d' },
                            { name: '90 dias (3 meses)', value: '90d' }
                        )
                )
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Você não tem permissão para usar este comando!', ephemeral: true });
        }

        const nome = interaction.options.getString('nome');
        const desconto = interaction.options.getNumber('desconto');
        const validade = interaction.options.getString('validade');

        const dias = parseInt(validade);
        const expiresAt = moment().add(dias, 'days').toDate();

        try {
            await client.db.addCoupon(interaction.guild.id, nome, desconto, expiresAt.toISOString());
            
            // Atualizar cache
            const guildCoupons = client.couponsCache.get(interaction.guild.id) || new Map();
            guildCoupons.set(nome.toLowerCase(), {
                guild_id: interaction.guild.id,
                name: nome.toLowerCase(),
                discount: desconto,
                expires_at: expiresAt.toISOString()
            });
            client.couponsCache.set(interaction.guild.id, guildCoupons);

            await interaction.reply({ 
                content: `✅ Cupom **${nome}** criado com sucesso!\n📉 Desconto: **${desconto}%**\n⏰ Validade: **${dias} dias**`, 
                ephemeral: true 
            });
        } catch (err) {
            if (err.message.includes('UNIQUE')) {
                await interaction.reply({ content: '❌ Já existe um cupom com esse nome!', ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Erro ao criar cupom: ${err.message}`, ephemeral: true });
            }
        }
    }
};
